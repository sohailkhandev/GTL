// ScrollToTop component which will take user to top on page after navigation to different page
import { useEffect } from "react";
import { useLocation } from "react-router";

// ScrollToTop component to automatically scroll to the top when the route changes
const ScrollToTop = (props) => {
  const location = useLocation();

  // Scroll to the top when the location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return <>{props.children}</>; // Render the children components
};

export default ScrollToTop;
