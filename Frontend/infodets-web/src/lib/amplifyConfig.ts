import { Amplify } from 'aws-amplify'

Amplify.configure(
  {
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
            scopes: ['phone', 'openid', 'email'],
            redirectSignIn: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN!, 'http://localhost:3000/auth/callback'],
            redirectSignOut: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT!],
            responseType: 'code',
          },
        },
      },
    },
  },
  { ssr: true }
)
