import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined;

function getUserPool() {
  if (!userPoolId || !clientId) {
    throw new Error("Organizer authentication is not configured.");
  }
  return new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
}

export interface NewPasswordChallenge {
  user: CognitoUser;
  attributes: Record<string, string>;
}

export type SignInResult =
  | { status: "SIGNED_IN"; session: CognitoUserSession }
  | { status: "NEW_PASSWORD_REQUIRED"; challenge: NewPasswordChallenge };

export function getOrganizerSession(): Promise<CognitoUserSession | null> {
  const currentUser = getUserPool().getCurrentUser();
  if (!currentUser) return Promise.resolve(null);

  return new Promise((resolve) => {
    currentUser.getSession((error: Error | null, session: CognitoUserSession | null) => {
      resolve(error || !session?.isValid() ? null : session);
    });
  });
}

export function signInOrganizer(email: string, password: string): Promise<SignInResult> {
  const user = new CognitoUser({ Username: email.trim(), Pool: getUserPool() });
  const details = new AuthenticationDetails({ Username: email.trim(), Password: password });

  return new Promise((resolve, reject) => {
    user.authenticateUser(details, {
      onSuccess: (session) => resolve({ status: "SIGNED_IN", session }),
      onFailure: reject,
      newPasswordRequired: (attributes) => {
        const safeAttributes = { ...attributes };
        delete safeAttributes.email;
        delete safeAttributes.email_verified;
        resolve({
          status: "NEW_PASSWORD_REQUIRED",
          challenge: { user, attributes: safeAttributes },
        });
      },
    });
  });
}

export function completeNewOrganizerPassword(
  challenge: NewPasswordChallenge,
  newPassword: string,
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    challenge.user.completeNewPasswordChallenge(newPassword, challenge.attributes, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

export function signOutOrganizer() {
  getUserPool().getCurrentUser()?.signOut();
}
