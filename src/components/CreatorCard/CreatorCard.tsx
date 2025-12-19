import styles from "./CreatorCard.module.css";
import type {CreatorCardProps} from "../../types/CreatorCard.tsx";
import Icon from "../Icon.tsx";

function CreatorCard({title, social}: CreatorCardProps) {
  const socialNetworks = [
    {
      iconSrc: "/src/assets/icons/telegram.svg",
      ariaLabel: "Telegram",
      network: social.telegram,
    },
    {
      iconSrc: "/src/assets/icons/github.svg",
      ariaLabel: "Github",
      network: social.github,
    }
  ]

  return (
    <div className={styles["creator-card"]}>
      <h3 className={styles["creator-title"]}>
        {title.toUpperCase()}
      </h3>
      {socialNetworks.map(({iconSrc, ariaLabel, network}, index) => (
        <div className={styles["creator-social"]} key={index}>
          <Icon
            className={styles["creator-social-icon"]}
            src={iconSrc}
            ariaLabel={ariaLabel}
            size={30}
          />
          <p className={styles["creator-social-text"]}>
            {network}
          </p>
        </div>
      ))}
    </div>
  )
}

export default CreatorCard;
