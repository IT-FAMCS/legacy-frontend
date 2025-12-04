import CreatorCard from "../../../components/CreatorCard/CreatorCard.tsx";
import styles from './CreatorsCards.module.css'
import creatorsInfo from './creatorsInfo.ts'

const CreatorsCards = () => {
  return (
    <div className={styles["creators-wrapper"]}>
      {creatorsInfo.map(({title, telegram, github,}, index) => (
        <CreatorCard
          title={title}
          social={{
            "telegram": telegram,
            "github": github,
          }}
          key={index}
        />
      ))}
    </div>
  )
}

export default CreatorsCards;