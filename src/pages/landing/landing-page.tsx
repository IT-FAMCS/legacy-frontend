import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import visibilityIcon from '../../assets/icons/eye.svg';
import background from "../../assets/images/title-wrapper-bg.png";
import { useNavigate } from 'react-router';

gsap.registerPlugin(ScrambleTextPlugin);

export function LandingPage() {
  const navigate = useNavigate();
  const visibilityIconRef = useRef<HTMLImageElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subTitleRef = useRef<HTMLDivElement>(null);
  const toggleTitle = useRef(false);
    
  const visibilityIconRotation = () => {
    gsap.to(visibilityIconRef.current,  {
      keyframes: [
        { rotation: -30, duration: 0.1 },
        { rotation: 30, duration: 0.1 },
        { rotation: 0, duration: 0.1 }
      ]
    });
  }
  
  const titleContainerTextScramble = () => {
    gsap.to(subTitleRef.current, {
      duration: 1,
      scrambleText: {
        text: "НАСЛЕДИЕ АКТИВА",
        chars: "FAMCS",
        speed: 0.5
      }
    });

    gsap.to(titleRef.current, {
      duration: 1,
      scrambleText: {
        text: "ФПМИ",
        chars: "FAMCS",
        speed: 0.5
      }
    });
  }

  const handleVisibilityMouseEnter = () => {
    visibilityIconRotation();
    titleContainerTextScramble();

    gsap.to(titleContainerRef.current,  {
      opacity: 0,
      duration: 0.25
    })
  }

  const handleVisibilityMouseLeave = () => {
    visibilityIconRotation();
    titleContainerTextScramble();

    gsap.to(titleContainerRef.current,  {
      opacity: 1,
      duration: 0.25
    });
  }

  useGSAP(() => {
    gsap.to(subTitleRef.current, {
      duration: 2.85,
      scrambleText: {
        text: "НАСЛЕДИЕ АКТИВА",
        chars: "FAMCS",
        speed: 0.5
      }
    });

    const titleInterval = setInterval(() => {
      toggleTitle.current = !toggleTitle.current;
      const titleText = toggleTitle.current ? "ФПМИ" : "FAMCS"

      gsap.to(titleRef.current, {
        duration: 1,
        scrambleText: {
          text: titleText,
          chars: "ФПМИFAMCS",
          speed: 0.5
        }
      });
    }, 2000)
    
    return () => clearInterval(titleInterval);
  }, []); 

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end",
      background: `url(${background})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      color: "#ffffff",
      position: "relative",
    }}>
      {/* Login Button - Beautiful styled */}
      <button
        onClick={() => navigate("/login")}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(104, 106, 207, 0.6)";
          e.currentTarget.style.background = "linear-gradient(135deg, #7a7cdf 0%, #6a6cc8 100%)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 15px rgba(104, 106, 207, 0.4)";
          e.currentTarget.style.background = "linear-gradient(135deg, #686ACF 0%, #5a5cb8 100%)";
        }}
        style={{
          position: "absolute",
          top: "30px",
          right: "30px",
          padding: "14px 32px",
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "white",
          background: "linear-gradient(135deg, #686ACF 0%, #5a5cb8 100%)",
          border: "2px solid rgba(255,255,255,0.3)",
          borderRadius: "50px",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 15px rgba(104, 106, 207, 0.4)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          zIndex: 100,
        }}
      >
        Войти
      </button>

      <img
        src={visibilityIcon}
        alt="Eye"
        ref={visibilityIconRef}
        style={{
          height: "3rem",
          width: "3rem",
          position: "absolute",
          top: "95px",
          left: "30px",
          zIndex: "1",
          cursor: "pointer",
        }}
        onMouseEnter={handleVisibilityMouseEnter}
        onMouseLeave={handleVisibilityMouseLeave}
      />
      <div ref={titleContainerRef} style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "40px",
        marginBlock: "10vh",
        width: "100%",
        paddingBottom: "100px",
      }}>
        <h2 ref={subTitleRef} style={{
          fontWeight: "500",
          textAlign: "center",
          justifyContent: "flex-end",
          fontSize: "max(7vw, 55px)",
          paddingInline: "6vw",
          lineHeight: "1.2",
          wordBreak: "break-word",
          margin: "0",
          color: "#ffffff",
        }}></h2>
        <h1 ref={titleRef} style={{
          fontStyle: "italic",
          color: "var(--color-gold-crest)",
          fontSize: "max(14vw, 80px)",
          fontWeight: "700",
          lineHeight: "1",
          margin: "0",
        }}></h1>
      </div>
    </div>
  );
}
