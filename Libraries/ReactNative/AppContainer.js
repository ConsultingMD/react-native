/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppContainer
 * @format
 * @flow
 */

'use strict';

const EmitterSubscription = require('EmitterSubscription');
const PropTypes = require('prop-types');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const View = require('View');

type Context = {
  rootTag: number,
};
type Props = {
  children?: React.Children,
  rootTag: number,
  WrapperComponent?: ?ReactClass<*>,
};
type State = {
  inspector: ?React.Element<*>,
  mainKey: number,
};

class AppContainer extends React.Component {
  props: Props;
  state: State = {
    inspector: null,
    mainKey: 1,
  };
  _mainRef: ?React.Element<*>;
  _subscription: ?EmitterSubscription = null;

  static childContextTypes = {
    rootTag: PropTypes.number,
  };

  getChildContext(): Context {
    return {
      rootTag: this.props.rootTag,
    };
  }

  componentDidMount(): void {
    if (__DEV__) {
      if (!global.__RCTProfileIsProfiling) {
        this._subscription = RCTDeviceEventEmitter.addListener(
          'toggleElementInspector',
          () => {
            const Inspector = require('Inspector');
            const inspector = this.state.inspector
              ? null
              : <Inspector
                  inspectedViewTag={ReactNative.findNodeHandle(this._mainRef)}
                  onRequestRerenderApp={updateInspectedViewTag => {
                    this.setState(
                      s => ({mainKey: s.mainKey + 1}),
                      () =>
                        updateInspectedViewTag(
                          ReactNative.findNodeHandle(this._mainRef),
                        ),
                    );
                  }}
                />;
            this.setState({inspector});
          },
        );
      }
    }
  }

  componentWillUnmount(): void {
    if (this._subscription) {
      this._subscription.remove();
    }
  }

  render(): React.Element<*> {
    let yellowBox = null;
    if (__DEV__) {
      if (!global.__RCTProfileIsProfiling) {
        const YellowBox = require('YellowBox');
        yellowBox = <YellowBox />;
      }
    }

    let innerView = (
      <View
        collapsable={!this.state.inspector}
        key={this.state.mainKey}
        pointerEvents="box-none"
        style={styles.appContainer}
        ref={ref => {
          this._mainRef = ref;
        }}>
        {this.props.children}
      </View>
    );

    const Wrapper = this.props.WrapperComponent;
    if (Wrapper) {
      innerView = <Wrapper>{innerView}</Wrapper>;
    }
    return (
      <View style={styles.appContainer} pointerEvents="box-none">
        {innerView}
        {yellowBox}
        {this.state.inspector}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});

module.exports = AppContainer;
