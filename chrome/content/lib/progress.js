function handynote_handleProgress(){
    this.QueryInterface = function(aIID){
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsIWebProgressListener2) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports)) 
            return this;
        throw Components.results.NS_NOINTERFACE;
    }
    
    this.onLocationChange = function(aProgress, aRequest, aURI){
    }
    
    this.onStateChange = function(){
    }
    this.onProgressChange = function(){
    }
    this.onStatusChange = function(){
    }
    this.onSecurityChange = function(){
    }
    this.onProgressChange64 = function(){
    }
    this.onRefreshAttempted = function(){
        return true;
    }
    
}
