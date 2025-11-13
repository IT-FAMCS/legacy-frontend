import Icon from './Icon.tsx';
import Button from "./Button.tsx";

const Header = () => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        backgroundColor: '#686ACF',
        zIndex: 1
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          width: '100%',
          margin: '0 auto',
          padding: '10px 25px',
          boxSizing: 'border-box'
        }}
      >
        <a
          href="/"
          aria-label="На главную"
          style={{display: 'flex', alignItems: 'center', gap: 12}}
        >
          <Icon
            src="/src/assets/icons/famcs.svg"
            ariaLabel="famcs"
            size={60}
          />
          <h1
            style={{fontSize: 35, fontWeight: 700, letterSpacing: '0.02em'}}
          >
            {"Legacy".toUpperCase()}
          </h1>
        </a>
        <nav style={{display: 'inline-flex', alignItems: 'center'}}>
          <Button
            href="#"
            isLabelHidden
            iconSrc="/src/assets/icons/profile.svg"
            iconSize={32}
            style={{border: 'none'}}
            hoverStyle={{scale: 1.08}}
          />
        </nav>
      </div>
    </header>
  )
};

export default Header;