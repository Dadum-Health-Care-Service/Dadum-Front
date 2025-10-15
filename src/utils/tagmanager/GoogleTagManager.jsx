import React, {useEffect} from 'react';
import TagManager from 'react-gtm-module';

const GoogleTagManager = ({gtmId}) => {
    useEffect(() => { 
        TagManager.initialize({gtmId: gtmId});
    }, []);
    return <></>
}

export default GoogleTagManager;