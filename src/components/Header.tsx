import { Link, useLocation } from "react-router-dom";
import { eventConfig } from "../config/event";

export default function Header() {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  return (
    <header className="site-header">
      <div className="page-container header-inner">
        <Link className="brand" to="/">
          <span>{eventConfig.appName}</span>
        </Link>

        {!isHomePage && (
          <nav aria-label="Navigimi kryesor">
            <Link className="nav-link nav-link-active header-home-link" to="/">
              Ballina
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
