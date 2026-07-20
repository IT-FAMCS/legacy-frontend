import { useState } from "react";
import Icon from "./Icon.tsx";
import Button from "./Button.tsx";
import { useUserStore } from "../stores/user";
import { useNavigate } from "react-router";
import {
  useCanManagePositions,
  useCanEditCategories,
  useCanRegisterUsers,
} from "../hooks/use-permissions";
import famcsIcon from "../assets/icons/famcs.svg";
import profileIcon from "../assets/icons/profile.svg";

const Header = () => {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Check permissions using position flags from backend via hooks
  const canManagePositions = useCanManagePositions();
  const canEditCategories = useCanEditCategories();
  const canRegisterUsers = useCanRegisterUsers();

  const goTo = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        height: "var(--header-height)",
        backgroundColor: "#686ACF",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          width: "100%",
          height: "100%",
          margin: "0 auto",
          padding: "10px 16px",
          boxSizing: "border-box",
        }}
      >
        <a
          href="/home"
          aria-label="На главную"
          style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
        >
          <Icon src={famcsIcon} ariaLabel="famcs" size={48} />
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            {"Legacy".toUpperCase()}
          </h1>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <nav className={`header-nav${menuOpen ? " header-nav-open" : ""}`}>
            {isAuthenticated && canEditCategories && (
              <Button
                label="На главную"
                onClick={() => goTo("/home")}
                style={{ border: "none" }}
                hoverStyle={{ scale: 1.08 }}
              />
            )}
            {isAuthenticated && (
              <Button
                label="Пользователи"
                onClick={() => goTo("/accounts")}
                style={{ border: "none" }}
                hoverStyle={{ scale: 1.08 }}
              />
            )}
            {isAuthenticated && canRegisterUsers && (
              <Button
                label="Регистрация"
                onClick={() => goTo("/register")}
                style={{ border: "none" }}
                hoverStyle={{ scale: 1.08 }}
              />
            )}
            {isAuthenticated && canManagePositions && (
              <Button
                label="Должности"
                onClick={() => goTo("/positions")}
                style={{ border: "none" }}
                hoverStyle={{ scale: 1.08 }}
              />
            )}
            {isAuthenticated && (
              <Button
                label="Отделы"
                onClick={() => goTo("/departments")}
                style={{ border: "none" }}
                hoverStyle={{ scale: 1.08 }}
              />
            )}
          </nav>

          {isAuthenticated && (
            <button
              type="button"
              className="header-burger"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                border: "none",
                background: "transparent",
                color: "white",
                fontSize: 26,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}

          <Button
            href="/account"
            onClick={() => goTo("/account")}
            isLabelHidden
            iconSrc={profileIcon}
            iconSize={32}
            style={{ border: "none" }}
            hoverStyle={{ scale: 1.08 }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
