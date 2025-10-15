import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TagManager from 'react-gtm-module';

function usePageView() {
  const location = useLocation();

  useEffect(() => {
    console.log("usePageView", location);
    if(window.dataLayer){
        console.log("window.datalayer", window.dataLayer);
        TagManager.dataLayer({
            dataLayer: {
              event: 'gtm.load',
              page_path: location.pathname,
            },
          });
    }
    
  }, [location]);
}

export default usePageView;
