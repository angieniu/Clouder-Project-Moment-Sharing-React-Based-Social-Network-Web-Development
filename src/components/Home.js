import React from 'react';
import { Tabs, Spin, Row, Col, Radio} from 'antd';
import {
    GEO_OPTIONS,
    POS_KEY,
    API_ROOT,
    AUTH_HEADER,
    TOKEN_KEY,
    POST_TYPE_IMAGE,
    POST_TYPE_VIDEO,
    POST_TYPE_UNKNOWN,
    TOPIC_AROUND,
    TOPIC_FACE
} from '../constants';

import CreatePostButton from './CreatePostButton';
import Gallery from './Gallery';
import AroundMap from './AroundMap';

const { TabPane } = Tabs;
// isLoadingPosts: flag determines whether show or not spinning
export class Home extends React.Component {
    state = {
        isLoadingGeoLocation: false,
        isLoadingPosts: false,
        error: '',
        posts: [],
        topic: TOPIC_AROUND
    }

    // When the component is rendered to the DOM for the first time
    // such as at page load we call the Geolocation API to determine
    // a latitude and longitude for the browser
    componentDidMount() {
        // fetch geolocation, navigator in window
        console.log(navigator.geolocation);
        if ("geolocation" in navigator) {
            this.setState({ isLoadingGeoLocation: true, error: '' }); // error 清空处理
            navigator.geolocation.getCurrentPosition( /*get location*/
                this.onSuccessLoadGeoLocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS,
            );
        } else {
            this.setState({ error: 'Geolocation is not supported.'});
        }
    }

    onSuccessLoadGeoLocation = (position) => {
        console.log(position);
        const { latitude, longitude } = position.coords;
        localStorage.setItem(POS_KEY, JSON.stringify({ lat: latitude, lon: longitude }));
        this.setState({ isLoadingGeoLocation: false, error: '' });
        this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = () => {
        this.setState({ isLoadingGeoLocation: false, error: 'Failed to load geo location.' });
    }
// fetch(`${API_ROOT}/search?lat=${lat}&lon=${lon}&range=20000`, {
    // fetch(`${API_ROOT}/search?lat=${37}&lon=${-121}&range=20000`, {
    loadNearbyPosts = (center, radius) => {
        const { lat, lon } = center ? center : JSON.parse(localStorage.getItem(POS_KEY));
        const range = radius ? radius : 20;
        // loadNearbyPosts = () => {
    //     const { lat, lon } = JSON.parse(localStorage.getItem(POS_KEY));
        const token = localStorage.getItem(TOKEN_KEY);
        this.setState({ isLoadingPosts: true, error: '' });
        return fetch(`${API_ROOT}/search?lat=${lat}&lon=${lon}&range=${range}`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`
            } /*Bearer验证方式 {options}*/
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } /*or .text*/
                throw new Error('Failed to load post.');
            })
            .then((data) => {
                console.log(data);
                this.setState({ posts: data ? data : [], isLoadingPosts: false });
            })
            .catch((e) => {
                console.error(e);
                this.setState({ isLoadingPosts: false, error: e.message });
            });
    }

    //封装 case1: image case2: video
    renderPosts(type) {
        const { error, isLoadingGeoLocation, isLoadingPosts, posts } = this.state;
        if (error) {
            return error;
        } else if (isLoadingGeoLocation) {
            return <Spin tip="Loading geo location..."/>;
        } else if (isLoadingPosts) {
            return <Spin tip="Loading posts..."/>
        } else if (posts.length > 0) {
            return type === POST_TYPE_IMAGE ? this.renderImagePosts() : this.renderVideoPosts();
        } else {
            return 'No nearby posts';
        }
    }

// default return 可能什么都没有，所以需要else{}.

    // has error // loading geolocation: isLoadingGeoLocation //loading posts // have posts ready // posts.length > 0 有数据
    //filter: 删除不需要的数据 remove video post
    //return <Gallery /> 进入Gallery组件
    renderImagePosts() {
        const { posts } = this.state;
        const images = posts
            .filter((post) => post.type === POST_TYPE_IMAGE)
            .map((post) => {
                return {
                    user: post.user,
                    src: post.url,
                    thumbnail: post.url,
                    caption: post.message,
                    thumbnailWidth: 400,
                    thumbnailHeight: 300,
                };
            });
        return <Gallery images={images}/>
    }

    // video controls 允许用户control video
    // Each column has horizontal padding (called a gutter) for controlling the space between them.
    /*
    includes no array inside
    Underscore.js: contains,

    */
    /*
    The controls attribute is a boolean attribute.

When present, it specifies that video controls should be displayed.

html 5 video tag, Video controls should include:

Play
Pause
Seeking
Volume
Fullscreen toggle
Captions/Subtitles (when available)
Track (when available)
    * */
    renderVideoPosts() {
        const { posts } = this.state;
        return (
            <Row gutter={30}>
                {
                    // post.type = string POST_TYPE_VIDEO,    POST_TYPE_UNKNOWN 的任意一个
                    posts
                        .filter((post) => [POST_TYPE_VIDEO,    POST_TYPE_UNKNOWN].includes(post.type))
                        .map((post) => (
                            <Col span={6} key={post.url}>
                                <video src={post.url} controls={true} className="video-block"/>
                                <p>{post.user}: {post.message}</p>
                            </Col>
                        ))
                }
            </Row>
        );
    }

    handleTopicChange = (e) => {
        // current selected value
        const topic = e.target.value;
        //reset
        // this.setState({topic: topic});  简写如下因为重名
        this.setState({ topic });
        //case1: topic around -> load nearby
        if (topic === TOPIC_AROUND) {
            this.loadNearbyPosts();
        }
        // case2: face around -> load facearound
        else {
            this.loadFacesAroundTheWolrd();
        }
    }

    loadFacesAroundTheWolrd = () => {
        // 去后端拿数据，先校验
        const token = localStorage.getItem(TOKEN_KEY);
        // set status to loading
        this.setState({ isLoadingPosts: true, error: '' });
        // fetch data from server url，配置信息 向后端发送api请求
        return fetch(`${API_ROOT}/cluster?term=face`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`,
            }
        })
            //拿到后端返回数据
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to load posts');
            })
            .then((data) => {
                console.log(data);
                this.setState({ posts: data ? data : [], isLoadingPosts: false });
            })
            .catch((e) => {
                console.error(e);
                this.setState({ isLoadingPosts: false , error: e.message });
            });
    }

    loadPostsByTopic = (center, radius) => {
        if (this.state.topic === TOPIC_AROUND) {
            return this.loadNearbyPosts(center, radius);
        } else {
            return this.loadFacesAroundTheWolrd();
        }
    }






    render() {
        const operations = <CreatePostButton loadNearbyPosts={this.loadNearbyPosts}/>;
        // const operations = <Button type="primary">Create New Post</Button>;
        return (
            <div>
                <Radio.Group onChange={this.handleTopicChange} value={this.state.topic}>
                    <Radio value={TOPIC_AROUND}>Posts Around Me</Radio>
                    <Radio value={TOPIC_FACE}>Faces Around The World</Radio>
                </Radio.Group>

                <Tabs tabBarExtraContent={operations} className="main-tabs">
                <TabPane tab="Image Posts" key="1">
                    {this.renderPosts(POST_TYPE_IMAGE)}
                    {/*{this.renderImagePosts()}*/}
                    {/* 不要直接写Gallery在这里，因为Tab Image和Tab Video都需要用到，并且还需要数据，所以用function写图片处理。Tab.TabPane */ /*{this.renderImagePosts()}*/}
                </TabPane>
                <TabPane tab="Video Posts" key="2">
                    {this.renderPosts(POST_TYPE_VIDEO)}
                </TabPane>
                <TabPane tab="Map" key="3">
                    <AroundMap
                        googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyD3CEh9DXuyjozqptVB5LA-dN7MxWWkr9s&v=3.exp&libraries=geometry,drawing,places"
                        loadingElement={<div style={{ height: `100%` }} />}
                        containerElement={<div style={{ height: `600px` }} />}
                        mapElement={<div style={{ height: `100%` }} />}
                        //父传子 key value pair
                        posts={this.state.posts}
                        loadPostsByTopic={this.loadPostsByTopic}
                        // loadNearbyPosts={this.loadNearbyPosts}
                    />
                </TabPane>
            </Tabs>
                </div>
        );
    }
}
export default Home;

//console.log('posts ->', imageArr); test