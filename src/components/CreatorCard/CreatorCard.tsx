import styles from "./CreatorCard.module.css";
import type { CreatorCardProps } from "../../interfaces/CreatorCard.tsx";
import Icon from "../Icon.tsx";

const CreatorCard = (
    {
        title,
        social,
    }: CreatorCardProps) => {
    return (
        <div className={styles["creator-card"]}>
            <h3 className={styles["creator-title"]}>
                {title.toUpperCase()}
            </h3>
            <div className={styles["creator-social"]}>
                <Icon
                    className={styles["creator-social-icon"]}
                    src="/src/assets/icons/telegram.svg"
                    ariaLabel="Telegram"
                    size={30}
                />
                <p className={styles["creator-social-text"]}>
                    {social.telegram}
                </p>
            </div>
            <div className={styles["creator-social"]}>
                <Icon
                    className={styles["creator-social-icon"]}
                    src="/src/assets/icons/github.svg"
                    ariaLabel="Github"
                    size={30}
                />
                <p className={styles["creator-social-text"]}>
                    {social.github}
                </p>
            </div>
        </div>
    )
}

export default CreatorCard;