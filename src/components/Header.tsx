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
          <small>{eventConfig.couple.display}</small>
        </Link>

        {!isHomePage && (
          <nav className="main-nav main-nav-back" aria-label="Navigimi kryesor">
            <Link className="nav-link nav-link-active" to="/">
              Ballina
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
