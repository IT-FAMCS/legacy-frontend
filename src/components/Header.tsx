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
  // Check permissions using position flags from backend via hooks
  const canManagePositions = useCanManagePositions();
  const canEditCategories = useCanEditCategories();
  const canRegisterUsers = useCanRegisterUsers();

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
          margin: "0 auto",
          padding: "10px 25px",
          boxSizing: "border-box",
        }}
      >
        <a
          href="/home"
          aria-label="На главную"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <Icon src={famcsIcon} ariaLabel="famcs" size={60} />
          <h1
            style={{
              fontSize: 35,
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "white",
            }}
          >
            {"Legacy".toUpperCase()}
          </h1>
        </a>
        <nav
          style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}
        >
          {isAuthenticated && canEditCategories && (
            <Button
              label="На главную"
              onClick={() => navigate("/home")}
              style={{ border: "none" }}
              hoverStyle={{ scale: 1.08 }}
            />
          )}
          {isAuthenticated && (
            <Button
              label="Пользователи"
              onClick={() => navigate("/accounts")}
              style={{ border: "none" }}
              hoverStyle={{ scale: 1.08 }}
            />
          )}
          {isAuthenticated && canRegisterUsers && (
            <Button
              label="Регистрация"
              onClick={() => navigate("/register")}
              style={{ border: "none" }}
              hoverStyle={{ scale: 1.08 }}
            />
          )}
          {isAuthenticated && canManagePositions && (
            <Button
              label="Должности"
              onClick={() => navigate("/positions")}
              style={{ border: "none" }}
              hoverStyle={{ scale: 1.08 }}
            />
          )}
          {isAuthenticated && (
            <Button
              label="Отделы"
              onClick={() => navigate("/departments")}
              style={{ border: "none" }}
              hoverStyle={{ scale: 1.08 }}
            />
          )}
          <Button
            href="/account"
            onClick={() => {
              navigate("/account");
            }}
            isLabelHidden
            iconSrc={profileIcon}
            iconSize={32}
            style={{ border: "none" }}
            hoverStyle={{ scale: 1.08 }}
          />
        </nav>
      </div>
    </header>
  );
};

export default Header;
