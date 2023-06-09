/**
 * @filename ScrollComponent.tsx
 * @Description: 截至目前为止我所见过的和使用过的最流畅的rn同时完美适配Android和iOS的下拉刷新上拉加载组件
 * 结合recyclerlistview的高性能内存回收利用机制简直是绝配
 */
import * as React from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  Platform,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import BaseScrollComponent, {
  ScrollComponentProps,
} from '../../../core/scrollcomponent/BaseScrollComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseItemAnimator } from '../../../core/ItemAnimator';
import TSCast from '../../../utils/TSCast';
import { Dimensions, Text, StyleSheet } from 'react-native';
import RecyclerListView from '../../../core/RecyclerListView';
import * as PropTypes from 'prop-types';
import { Animated } from 'react-native';
import { Easing } from 'react-native';

/***
 * The responsibility of a scroll component is to report its size, scroll events and provide a way to scroll to a given offset.
 * FindRecyclerListView works on top of this interface and doesn't care about the implementation. To support web we only had to provide
 * another component written on top of web elements
 */

export default class PullRefreshScrollView extends BaseScrollComponent {
  private _height: number;
  private _width: number;
  private _isSizeChangedCalledOnce: boolean;
  private _dummyOnLayout: (event: LayoutChangeEvent) => void = TSCast.cast(null);
  private _scrollViewRef: ScrollView | null = null;
  public static propTypes = {};
  private transform;
  private base64Icon;
  private loadMoreHeight: number;
  private dragFlag;
  private prStoryKey;
  private flag;
  private timer: any;

  constructor(args: ScrollComponentProps) {
    super(args);
    this.state = {
      prTitle: args.refreshText,
      loadTitle: args.endingText,
      prLoading: false,
      prArrowDeg: new Animated.Value(0),
      prTimeDisplay: '暂无',
      beginScroll: null,
      prState: 0,
    };
    this.loadMoreHeight = 60;
    this.dragFlag = false; //scrollview是否处于拖动状态的标志
    this.base64Icon =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABQBAMAAAD8TNiNAAAAJ1BMVEUAAACqqqplZWVnZ2doaGhqampoaGhpaWlnZ2dmZmZlZWVmZmZnZ2duD78kAAAADHRSTlMAA6CYqZOlnI+Kg/B86E+1AAAAhklEQVQ4y+2LvQ3CQAxGLSHEBSg8AAX0jECTnhFosgcjZKr8StE3VHz5EkeRMkF0rzk/P58k9rgOW78j+TE99OoeKpEbCvcPVDJ0OvsJ9bQs6Jxs26h5HCrlr9w8vi8zHphfmI0fcvO/ZXJG8wDzcvDFO2Y/AJj9ADE7gXmlxFMIyVpJ7DECzC9J2EC2ECAAAAAASUVORK5CYII=';
    this._onScroll = this._onScroll.bind(this);
    this._onLayout = this._onLayout.bind(this);

    this._height = 0;
    this._width = 0;
    this.prStoryKey = 'prtimekey';
    this._isSizeChangedCalledOnce = false;
    this.flag = args.flag;
  }

  public scrollTo(x: number, y: number, isAnimated: boolean): void {
    if (this._scrollViewRef) {
      this._scrollViewRef.scrollTo({ x, y, animated: isAnimated });
    }
  }

  UNSAFE_componentWillReceiveProps() {
    // if (this.flag !== this.props.flag) {
    //     if (Platform.OS === 'android') {
    //         this.setState({
    //             prTitle: this.props.refreshingText,
    //             prLoading: true,
    //             prArrowDeg: new Animated.Value(0),
    //
    //         });
    //         this.timer = setTimeout(() => {
    //             this._scrollViewRef &&
    //             this._scrollViewRef.scrollTo({x: 0, y: this.loadMoreHeight, animated: true});
    //             this.timer && clearTimeout(this.timer);
    //         }, 1000);
    //     }
    //     this.flag = this.props.flag;
    // }
  }

  componentDidMount() {
    if (Platform.OS === 'android' && this.props.enablerefresh) {
      this.setState({
        prTitle: this.props.refreshingText,
        prLoading: true,
        prArrowDeg: new Animated.Value(0),
      });
      this.timer = setTimeout(() => {
        this._scrollViewRef &&
          this._scrollViewRef.scrollTo({
            x: 0,
            y: this.loadMoreHeight,
            animated: true,
          });
        this.timer && clearTimeout(this.timer);
      }, 1000);
    }
  }

  public render(): JSX.Element {
    const Scroller: any = TSCast.cast<ScrollView>(this.props.externalScrollView); //TSI

    return (
      <Scroller
        ref={(scrollView: any) => {
          this._scrollViewRef = scrollView as ScrollView | null;
          return this._scrollViewRef;
        }}
        onMomentumScrollEnd={(e) => {
          if (Platform.OS === 'android') {
            let target = e.nativeEvent;
            let y = target.contentOffset.y;

            if (y <= this.loadMoreHeight) {
              this.setState({
                prTitle: this.props.refreshingText,
                prLoading: true,
                prArrowDeg: new Animated.Value(0),
              });
            }
          }
        }}
        bounces={this.props.enablerefresh}
        onScrollEndDrag={(e) => this.onScrollEndDrag(e)}
        onScrollBeginDrag={() => this.onScrollBeginDrag()}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        {...this.props}
        horizontal={this.props.isHorizontal}
        onScroll={this._onScroll}
        onLayout={
          !this._isSizeChangedCalledOnce || this.props.canChangeSize
            ? this._onLayout
            : this._dummyOnLayout
        }
      >
        <View style={{ flexDirection: this.props.isHorizontal ? 'row' : 'column' }}>
          {this.props.enablerefresh ? this.renderIndicatorContent() : null}
          {this.props.renderHeader && this.props.renderHeader()}
          <View
            style={{
              height:
                Platform.OS === 'ios'
                  ? this.props.contentHeight
                  : Dimensions.get('window').height - this.props.contentHeight < 0
                  ? this.props.contentHeight
                  : Dimensions.get('window').height,
              width: this.props.contentWidth,
            }}
          >
            {this.props.children}
          </View>
          {this.props.renderFooter && this.props.renderFooter()}
          {this.props?.enableLoadMore ? this.renderIndicatorContentBottom() : null}
        </View>
      </Scroller>
    );
  }

  // 手指未离开
  onScrollBeginDrag() {
    this.setState({
      beginScroll: true,
    });
    this.dragFlag = true;

    if (this.props.onScrollBeginDrag) {
      this.props.onScrollBeginDrag();
    }
  }

  // 手指离开
  onScrollEndDrag(e) {
    let target = e.nativeEvent;
    let y = target.contentOffset.y;

    this.dragFlag = false;
    if (y <= this.loadMoreHeight && y >= 10 && Platform.OS === 'android') {
      this._scrollViewRef.scrollTo({
        x: 0,
        y: this.loadMoreHeight,
        animated: true,
      });
    }
    if (this.state.prState) {
      // 回到待收起状态
      this._scrollViewRef.scrollTo({ x: 0, y: -70, animated: true });

      this.setState({
        prTitle: this.props.refreshingText,
        prLoading: true,
        prArrowDeg: new Animated.Value(0),
        prState: 0,
      });

      // 触发外部的下拉刷新方法
      if (this.props.onRefresh) {
        this.props.onRefresh(this);
      }
    }
  }

  renderIndicatorContent() {
    let type = this.props.refreshType;
    let jsx = [this.renderNormalContent()];

    return (
      <View
        style={
          Platform.OS === 'ios'
            ? styles.pullRefresh
            : {
                width: Dimensions.get('window').width,
                height: this.loadMoreHeight,
              }
        }
      >
        {jsx.map((item, index) => {
          return <View key={index}>{item}</View>;
        })}
      </View>
    );
  }

  renderNormalContent() {
    this.transform = [
      {
        rotate: this.state.prArrowDeg.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-180deg'],
        }),
      },
    ];
    let jsxarr = [];
    let arrowStyle: any = {
      position: 'absolute',
      width: 14,
      height: 23,
      left: -50,
      top: -4,
      transform: this.transform,
    };
    let indicatorStyle: any = {
      position: 'absolute',
      left: -40,
      top: 2,
      width: 16,
      height: 16,
    };

    if (this.props.indicatorImg.url) {
      if (this.props.indicatorImg.style) {
        indicatorStyle = this.props.indicatorImg.style;
      }
      if (this.state.prLoading) {
        //@ts-ignore
        jsxarr.push(
          <ImageBackground style={indicatorStyle} source={{ uri: this.props.indicatorImg.url }} />,
        );
      } else {
        jsxarr.push(null);
      }
    } else if (this.state.prLoading) {
      //@ts-ignore
      jsxarr.push(<ActivityIndicator style={indicatorStyle} animating={true} color={'#488eff'} />);
    } else {
      jsxarr.push(null);
    }

    if (this.props.indicatorArrowImg.url) {
      if (this.props.indicatorArrowImg.style) {
        arrowStyle = this.props.arrowStyle.style;
      }
      arrowStyle.transform = this.transform;
      if (!this.state.prLoading) {
        jsxarr.push(
          <Animated.Image
            style={arrowStyle}
            resizeMode={'contain'}
            source={{ uri: this.props.indicatorArrowImg.url }}
          />,
        );
      } else {
        jsxarr.push(null);
      }
    } else if (!this.state.prLoading) {
      jsxarr.push(
        <Animated.Image
          style={arrowStyle}
          resizeMode={'contain'}
          source={{ uri: this.base64Icon }}
        />,
      );
    } else {
      jsxarr.push(null);
    }
    jsxarr.push(<Text style={styles.prState}>{this.state.prTitle}</Text>);

    return (
      <View style={{ alignItems: 'center' }}>
        <View style={styles.indicatorContent}>
          {jsxarr.map((item, index) => {
            return <View key={index}>{item}</View>;
          })}
        </View>
        <Text style={styles.prText}>上次更新时间：{this.state.prTimeDisplay}</Text>
      </View>
    );
  }

  renderIndicatorContentBottom() {
    let jsx = [this.renderBottomContent()];

    return (
      <View style={styles.loadMore}>
        {jsx.map((item, index) => {
          return <View key={index}>{item}</View>;
        })}
      </View>
    );
  }

  /**
   * 数据加载完成
   */
  onLoadFinish() {
    this.setState({ loadTitle: this.props.endText });
  }

  /**
   * 没有数据可加载
   */
  onNoDataToLoad() {
    this.setState({ loadTitle: this.props.noDataText });
  }

  /**
   * @function: 刷新结束
   */
  onRefreshEnd() {
    let now = new Date().getTime();

    this.setState({
      prTitle: this.props.refreshText,
      prLoading: false,
      beginScroll: false,
      prTimeDisplay: dateFormat(now, 'yyyy-MM-dd hh:mm'),
    });

    // 存一下刷新时间
    AsyncStorage.setItem(this.prStoryKey, now.toString());
    if (Platform.OS === 'ios') {
      this._scrollViewRef.scrollTo({ x: 0, y: 0, animated: true });
    } else if (Platform.OS === 'android') {
      this._scrollViewRef.scrollTo({
        x: 0,
        y: this.loadMoreHeight,
        animated: true,
      });
    }
  }

  renderBottomContent() {
    let jsx = [];
    let indicatorStyle = {
      position: 'absolute',
      left: -40,
      top: -1,
      width: 16,
      height: 16,
    };

    jsx.push(
      <Text key={2} style={{ color: '#979aa0' }}>
        {this.state.loadTitle}
      </Text>,
    );

    return jsx;
  }

  private _onScroll(event?: NativeSyntheticEvent<NativeScrollEvent>): void {
    if (event) {
      this.props.onScroll(
        event.nativeEvent.contentOffset.x,
        event.nativeEvent.contentOffset.y,
        event,
      );
    }
    let target = event.nativeEvent;
    let y = target.contentOffset.y;

    if (this.dragFlag) {
      if (Platform.OS === 'ios') {
        if (y <= -70) {
          this.upState();
        } else {
          this.downState();
        }
      } else if (Platform.OS === 'android') {
        if (y <= 10) {
          this.upState();
        } else {
          this.downState();
        }
      }
    }
    //解决Android用户端迅速拉动列表手指放开的一瞬间列表还在滚动
    else {
      if (y === 0 && Platform.OS === 'android') {
        this.setState({
          prTitle: this.props.refreshingText,
          prLoading: true,
          prArrowDeg: new Animated.Value(0),
        });
        this.onRefreshEnd();
      }
    }

    if (event) {
      this.props.onScroll(
        event.nativeEvent.contentOffset.x,
        event.nativeEvent.contentOffset.y,
        event,
      );
    }
  }

  // 高于临界值状态
  upState() {
    this.setState({
      prTitle: this.props.refreshedText,
      prState: 1,
    });

    Animated.timing(this.state.prArrowDeg, {
      toValue: 1,
      duration: 100,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: BaseItemAnimator.USE_NATIVE_DRIVER,
    }).start();
  }

  // 低于临界值状态
  downState() {
    this.setState({
      prTitle: this.props.refreshText,
      prState: 0,
    });
    Animated.timing(this.state.prArrowDeg, {
      toValue: 0,
      duration: 100,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: BaseItemAnimator.USE_NATIVE_DRIVER,
    }).start();
  }

  private _onLayout(event: LayoutChangeEvent): void {
    console.log('_onLayout');
    if (
      this._height !== event.nativeEvent.layout.height ||
      this._width !== event.nativeEvent.layout.width
    ) {
      this._height = event.nativeEvent.layout.height;
      this._width = event.nativeEvent.layout.width;
      if (this.props.onSizeChanged) {
        this._isSizeChangedCalledOnce = true;
        this.props.onSizeChanged(event.nativeEvent.layout);
      }
    }
  }
}

const dateFormat = function (dateTime, fmt) {
  let date = new Date(dateTime);

  let tmp = fmt || 'yyyy-MM-dd';
  let o = {
    'M+': date.getMonth() + 1, //月份
    'd+': date.getDate(), //日
    'h+': date.getHours(), //小时
    'm+': date.getMinutes(), //分
    's+': date.getSeconds(), //秒
    'q+': Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  };

  if (/(y+)/.test(tmp)) {
    tmp = tmp.replace(RegExp.$1, String(date.getFullYear()).substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(tmp)) {
      tmp = tmp.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(String(o[k]).length),
      );
    }
  }
  return tmp;
};

const styles = StyleSheet.create({
  pullRefresh: {
    position: 'absolute',
    top: -69,
    left: 0,
    backfaceVisibility: 'hidden',
    right: 0,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  loadMore: {
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    height: 70,
    backgroundColor: '#fafafa',
    color: '#979aa0',
  },
  prText: {
    marginBottom: 4,
    color: '#979aa0',
    fontSize: 12,
  },

  prState: {
    marginBottom: 4,
    fontSize: 12,
    color: '#979aa0',
  },
  lmState: {
    fontSize: 12,
  },
  indicatorContent: {
    flexDirection: 'row',
    marginBottom: 5,
  },
});
