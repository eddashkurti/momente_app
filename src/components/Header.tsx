import { Camera, Images, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { eventConfig } from "../config/event";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? " nav-link-active" : ""}`;

  return (
    <header className="site-header">
      <div className="page-container header-inner">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span>{eventConfig.appName}</span>
          <small>{eventConfig.couple.display}</small>
        </Link>

        <button
          className="menu-button"
          type="button"
          aria-label={open ? "Mbyll menynë" : "Hap menynë"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`main-nav${open ? " main-nav-open" : ""}`}>
          <NavLink className={navClass} to="/" end onClick={() => setOpen(false)}>
            Ballina
          </NavLink>
          <NavLink className={navClass} to="/upload" onClick={() => setOpen(false)}>
            <Camera size={17} /> Ngarko
          </NavLink>
          <NavLink className={navClass} to="/gallery" onClick={() => setOpen(false)}>
            <Images size={17} /> Galeria
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
