// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : ' 832282320285641 ',
        'clientSecret'  : ' f59ee167764aa4ef2ed14bde1f5ec3b9 ',
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email'

    },

    'twitterAuth' : {
        'consumerKey'        : 'your-consumer-key-here',
        'consumerSecret'     : 'your-client-secret-here',
        'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '694374735549-telf0cjtdbqtf3gn3atb6utofv6mh251.apps.googleusercontent.com',
        'clientSecret'  : 'uNlTNdrSW2pO9Wfsj5s3Tvs9',
        'callbackURL'      : 'http://localhost:8080/auth/google/callback'
    }

};
