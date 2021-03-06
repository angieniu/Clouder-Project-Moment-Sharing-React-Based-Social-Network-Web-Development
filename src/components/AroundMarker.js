import React from 'react';
import { Marker, InfoWindow } from 'react-google-maps';
// 类型校验
import PropTypes from 'prop-types';
import blueMarkerUrl from '../assets/images/blue-marker.svg';

// tomchentw.github.io/react-google-maps/#marker
// props 类型的类型校验,一定是object 并且is required.
class AroundMarker extends React.Component {
    static propTypes = {
        post: PropTypes.object.isRequired,
    }

    state = {
        isOpen: false,
    }
//prevState两种方法  // AroundMap.js里面需要写上post={post} 然后这里使用this.props.post  // undefined 不变，用default红色的
    handleToggle = () => {
        this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
    }

    render() {
        const { user, message, url, location, type } = this.props.post;
        const { lat, lon } = location;
        const isImagePost = type === 'image';

        const customIcon = isImagePost ? undefined : {
            url: blueMarkerUrl,
            scaledSize: new window.google.maps.Size(26, 41),
        };

        return (
            <Marker
                position={{ lat, lng: lon }}
                //image
                onMouseOver={isImagePost ? this.handleToggle : undefined}
                //handleToggle 开关
                onMouseOut={isImagePost ? this.handleToggle: undefined}
                // video
                onClick={isImagePost ? undefined: this.handleToggle}
                icon={customIcon}

                // onMouseOver={this.handleToggle}
                // onMouseOut={this.handleToggle}
                onClick={this.handleToggle}
            >
                {this.state.isOpen ? (
                    <InfoWindow>
                        <div>
                            {isImagePost
                                ? <img src={url} alt={message} className="around-marker-image"/>
                                : <video src={url} controls className="around-marker-video"/>}
                            <p>{`${user}: ${message}`}</p>

                        </div>
                    </InfoWindow>
                ) : null}
            </Marker>
        );
    }
}
export default AroundMarker;

