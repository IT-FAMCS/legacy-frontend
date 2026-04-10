import Icon from "./Icon.tsx";
import Button from "./Button.tsx";
import { useUserStore } from "../stores/user";
import { useNavigate } from "react-router";

const Header = () => {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

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
          href="/"
          aria-label="На главную"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <Icon src="/src/assets/icons/famcs.svg" ariaLabel="famcs" size={60} />
          <h1
            style={{ fontSize: 35, fontWeight: 700, letterSpacing: "0.02em" }}
          >
            {"Legacy".toUpperCase()}
          </h1>
        </a>
        <nav style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
          {isAuthenticated && user?.role === "admin" && (
            <Button
              label="Пользователи"
              onClick={() => navigate("/accounts")}
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
            iconSrc="/src/assets/icons/profile.svg"
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
