import Button from "./Button.tsx";

const Footer = () => {
  return (
    <footer
      style={{
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
          padding: '12px 30px',
          boxSizing: 'border-box'
        }}
      >
        <p style={{fontSize: 18, fontWeight: 500, color: '#FFFFFF'}}>
            © {"It-Famcs".toUpperCase()} <time dateTime="2025">2025</time>
        </p>
        <nav style={{display: 'inline-flex', alignItems: 'center'}}>
          <Button
            href="#"
            label={"О создателях".toUpperCase()}
            style={{fontWeight: 500, letterSpacing: '0.02em'}}
            hoverStyle={{color: "#686ACF", background: '#FFFFFF'}}
            activeStyle={{color: "#686ACF"}}
            ariaLabel="О создателях"
          />
        </nav>
      </div>
    </footer>
  )
};

export default Footer;