import raccoon from "../assets/images/trainee-raccoon.png";
import "../styles/trainee.css";

export function TraineeRaccoon({ large = false }: { large?: boolean }) {
  return <img className={`trainee-raccoon${large ? " trainee-raccoon-large" : ""}`} src={raccoon}
    alt="" aria-hidden="true" width={large ? 144 : 64} height={large ? 144 : 64} />;
}
