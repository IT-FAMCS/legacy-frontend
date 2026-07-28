import { useRef, useState } from 'react';
import gsap from 'gsap';
import  { useGSAP } from '@gsap/react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import visibilityIcon from '../../../assets/icons/eye.svg';
import background from "../../../assets/images/title-wrapper-bg.png";
import { DancingRaccoon } from '../../../components/DancingRaccoon';

gsap.registerPlugin(ScrambleTextPlugin);

// Easter egg: click the "НАСЛЕДИЕ АКТИВА" subtitle 5 times in a row (within
// 2s of each other) to summon a dancing raccoon for a few seconds — same
// easter egg as on the public landing page (landing-page.tsx), duplicated
// here since this wrapper renders the same title on the logged-in home page.
const RACCOON_DANCE_STYLES = ["disco", "groove", "twist"] as const;
const RACCOON_CLICKS_REQUIRED = 5;
const RACCOON_CLICK_WINDOW_MS = 2000;

const TitleWrapper = () => {
  const visibilityIconRef = useRef<HTMLImageElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subTitleRef = useRef<HTMLDivElement>(null);
  const toggleTitle = useRef(false);
  const raccoonClickCountRef = useRef(0);
  const raccoonLastClickAtRef = useRef(0);
  const raccoonHideTimerRef = useRef<number | null>(null);
  const [raccoonDanceStyle, setRaccoonDanceStyle] = useState<(typeof RACCOON_DANCE_STYLES)[number] | null>(null);

  const handleTitleClick = () => {
    const now = Date.now();
    if (now - raccoonLastClickAtRef.current > RACCOON_CLICK_WINDOW_MS) {
      raccoonClickCountRef.current = 0;
    }
    raccoonLastClickAtRef.current = now;
    raccoonClickCountRef.current += 1;

    if (raccoonClickCountRef.current >= RACCOON_CLICKS_REQUIRED) {
      raccoonClickCountRef.current = 0;
      const style = RACCOON_DANCE_STYLES[Math.floor(Math.random() * RACCOON_DANCE_STYLES.length)];
      const durationMs = 5000 + Math.random() * 2000; // 5-7s
      setRaccoonDanceStyle(style);
      if (raccoonHideTimerRef.current) window.clearTimeout(raccoonHideTimerRef.current);
      raccoonHideTimerRef.current = window.setTimeout(() => setRaccoonDanceStyle(null), durationMs);
    }
  };

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
      color: "#ffffff"
    }}>
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
          zIndex : "1"
        }}
        onMouseEnter = {handleVisibilityMouseEnter}
        onMouseLeave = {handleVisibilityMouseLeave}
      />
      <div ref={titleContainerRef} style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "40px",
        marginBlock: "10vh",
        width: "100%"
      }}>
          <h2
            ref={subTitleRef}
            onClick={handleTitleClick}
            style={{
              fontWeight: "500",
              textAlign: "center",
              justifyContent: "flex-end",
              fontSize: "max(7vw, 55px)",
              paddingInline: "6vw",
              lineHeight: "1.2",
              wordBreak: "break-word",
              margin: "0",
              cursor: "pointer",
              userSelect: "none",
            }}
          ></h2>
          <h1 ref={titleRef} style={{
            fontStyle: "italic",
            color: "var(--color-gold-crest)",
            fontSize: "max(14vw, 80px)",
            fontWeight: "700",
            lineHeight: "1",
            margin: "0",
            userSelect: "none",
          }}></h1>
      </div>

      {raccoonDanceStyle && <DancingRaccoon variant={raccoonDanceStyle} />}
    </div>
  );
};

export default TitleWrapper;
