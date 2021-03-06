import * as React from "react"
import { Grid, Button, Container, Dimmer, Loader, Image } from 'semantic-ui-react'
import * as messages from '../components/messages'
import { checkSubscription } from "./components/server";
import settings from "../settings";

interface IAppProps { }
interface IAppState {
  isLoading: boolean
  isLoggedIn: boolean
  hasActiveSubscription: boolean
}

export default class Popup extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props)
    this.onSignIn = this.onSignIn.bind(this)
    this.onSignOut = this.onSignOut.bind(this)
    this.state = {
      isLoading: true,
      isLoggedIn: false,
      hasActiveSubscription: false
    }
    chrome.runtime.sendMessage({
      type: messages.Type.AUTH0_GET_PROFILE
    }, async (res: any) => {
      if (res) {
        // is logged in
        this.setState({
          isLoggedIn: true
        })
        this.checkSubscription(res.access_token)
      } else {
        this.setState({
          isLoading: false
        })
      }
    })
  }
  public render() {
    const { isLoading, isLoggedIn, hasActiveSubscription } = this.state
    if (isLoading) {
      return (
        <div style={{ height: '200px' }}>
          <Dimmer active>
            <Loader>Checking account details</Loader>
          </Dimmer>
        </div>
      )
    }
    return (
      <Container>

        <Grid>
          <Grid.Row centered columns='1'>
            <Grid.Column>
              <Image centered src='/icons/logo.png' size='small' />
            </Grid.Column>
          </Grid.Row>
          {isLoggedIn && !hasActiveSubscription ?
            <Grid.Row centered>
              <div>Your subscription is currently not active.<br /> <a href={settings.homePage} target='_blank'>Click here to sign up.</a></div>
            </Grid.Row> : null
          }
          {isLoggedIn && hasActiveSubscription ?
            <Grid.Row centered>
              <div>Your subscription is active.</div>
            </Grid.Row> : null
          }
          {isLoggedIn ? <Grid.Row centered>
            <Button color='orange' icon='sign out' content='Sign out' onClick={this.onSignOut} />
          </Grid.Row> : <Grid.Row centered>
              <Button color='orange' icon='sign in' content='Sign in' onClick={this.onSignIn} />
            </Grid.Row>
          }
          {!isLoggedIn ? <Grid.Row centered>
            <Button color='orange' icon='clipboard' content='Sign up' as='a' target='_blank' href={settings.homePage} />
          </Grid.Row> : null}
        </Grid>
      </Container>
    )
  }
  private async checkSubscription(accessToken: string) {
    try {
      const r = await checkSubscription({
        accessToken
      })
      this.setState({
        hasActiveSubscription: r.active,
        isLoading: false
      })
    } catch (e) {
      console.log(e)
      this.setState({
        isLoading: false
      })
    }
  }
  private onSignIn() {
    const msg: messages.IAuth0SignIn = {
      type: messages.Type.AUTH0_SIGN_IN
    }
    this.setState({
      isLoading: true
    })
    chrome.runtime.sendMessage(msg, async (authResponse) => {
      console.log('signed in', authResponse)
      this.setState({
        isLoggedIn: true
      })
      this.checkSubscription(authResponse.access_token)
    })
  }
  private onSignOut() {
    const msg: messages.IAuth0SignOut = {
      type: messages.Type.AUTH0_SIGN_OUT
    }
    chrome.runtime.sendMessage(msg, (authResponse) => {
      console.log(authResponse)
      this.setState({
        hasActiveSubscription: false,
        isLoggedIn: false
      })
    })
  }
}
