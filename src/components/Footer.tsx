import { eventConfig } from "../config/event";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-rule" />
        <p>{eventConfig.footer}</p>
      </div>
    </footer>
  );
}
