import { useEffect, useState } from "react";

const useIsDesktop = (bp = 768) => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ?
      window.innerWidth >= bp :
      true
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= bp);
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, [bp]);

  return isDesktop;
};

export default useIsDesktop;