import { useRef } from 'react';
import gsap from 'gsap';
import  { useGSAP } from '@gsap/react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import visibilityIcon from '../../../assets/icons/eye.svg';
import styles from './TitleWrapper.module.css';

gsap.registerPlugin(ScrambleTextPlugin);

const TitleWrapper = () => {
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
    <div className={styles["wrapper"]}>
      <img
        src={visibilityIcon}
        alt="Eye"
        ref={visibilityIconRef}
        className={styles["visibility-icon"]}
        onMouseEnter = {handleVisibilityMouseEnter}
        onMouseLeave = {handleVisibilityMouseLeave}
      />
      <div className={styles["title-container"]} ref={titleContainerRef}>
          <h2 className={styles["subtitle-text"]} ref={subTitleRef}></h2>
          <h1 className={styles["title-text"]} ref={titleRef}></h1>
      </div>
    </div>
  )
}

export default TitleWrapper;