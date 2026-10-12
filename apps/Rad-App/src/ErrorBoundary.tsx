import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen';
import { copy } from './config';

type Props = { children: ReactNode };
type State = { failed: boolean; attempt: number };

/**
 * Catches render errors anywhere in the app and shows the Persian error screen.
 * "Reload" remounts the tree, which reopens the site from the home page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Development only; production never surfaces technical details.
    // Crash reporting (ROADMAP item 6) will hook in here.
    if (__DEV__) console.error(error, info.componentStack);
  }

  private reload = () => {
    this.setState(s => ({ failed: false, attempt: s.attempt + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <ErrorScreen
          title={copy.errorTitle}
          body={copy.crashBody}
          primary={{ label: copy.reload, onPress: this.reload }}
        />
      );
    }
    // A new key after "reload" remounts children from scratch.
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
