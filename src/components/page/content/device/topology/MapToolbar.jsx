import React from 'react'

import { ChromePicker } from 'react-color'
import { findIndex } from 'lodash'

import DeviceMenu from './DeviceMenu.jsx'
import { lineTypes } from 'shared/Global.jsx'

export default class Toolbar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedObj: null,
            cmap: null,

            displayColorPicker: false,

            displayLineType: false,
            displayDevices: false,
        }

        this.lineTypes = lineTypes

        this.loadLineTypes()

        this.handleClick = this.handleClick.bind(this)
    }

    componentWillMount() {

        document.addEventListener('click', this.handleClick, false);
    }

    componentWillUnmount() {

        document.removeEventListener('click', this.handleClick, false);
    }

    loadLineTypes() {

        $.get(Api.deviceadmin.getShapeTypes)
        .done((res) => {

            let lineTypes = this.lineTypes

            $.each(res || [], function(i, type){

                let index = findIndex(lineTypes, {typename: type.devicename})
                if (index >= 0) lineTypes[index]['typeid'] = type.devicetype
            });

            this.setState({lineTypes})
        });
    }

    render() {

        const cmap = this.state.cmap
        const obj = this.state.selectedObj

        const line = obj ? cmap.selectedLine() : null
        const lineGroup = line ? line.objectSubType == MapItemType.ShapeLineGroup : false
        const text = obj ? cmap.selectedText() : null
        const hub = obj ? cmap.selectedLonghub() : null

        const popover = {
            position: 'absolute',
            zIndex: '2',
            left: '-40px',
            top: '30px',

        }
        const cover = {
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        }

        return (
            <div className="panel-heading map-heading">
                <h4 className="panel-title">Topology</h4>
                <div className="panel-options main-map-options" style={{top: "9px"}}>
                    <ul className="nav nav-tabs" style={{background: "transparent"}}>

                        <li>
                            <a href="javascript:"
                               className="option trash p-none"  style={{display: obj ? "block" : "none"}}
                               onClick={this.props.onClickDelete}>
                                <i className="fa fa-trash-o" title="Delete"></i>
                            </a>
                        </li>
                        <li>
                            <div className="input-group colorpicker-element" style={{display: lineGroup ? "block" : "none"}}
                                 onClick={this.onClickColorPicker.bind(this)}>
                                <div className="input-group-addon">
                                    <i className="color-preview" style={{background: lineGroup ? line.getStrokeColor() : 'black'}}></i>
                                </div>
                            </div>

                            {
                                this.state.displayColorPicker ? <div style={ popover }>
                                    <div style={ cover } onClick={ this.onCloseColorPicker.bind(this) }/>
                                    <ChromePicker color={lineGroup ? line.getStrokeColor() : 'black'}
                                                  onChangeComplete={this.onChangeColorPicker.bind(this)}/>
                                </div> : null
                            }

                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: lineGroup ? "block" : "none"}}
                               onClick={this.props.onClickLineWidthInc}>
                                <i className="fa fa-expand" title="Increase Line Width"></i>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: lineGroup ? "block" : "none"}}
                                onClick={this.props.onClickLineWidthDec}>
                                <i className="fa fa-compress" title="Decrease Line Width"></i>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: text ? "block" : "none"}}
                               onClick={this.props.onClickFontSizeUp}> <i className="fa fa-arrow-up" title="Increase Font Size"></i>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: text ? "block" : "none"}}
                               onClick={this.props.onClickFontSizeDown}> <i className="fa fa-arrow-down" title="Decrease Font Size"></i>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: text ? "block" : "none"}}
                               onClick={this.props.onClickAlignLeft}> <i className="fa fa-align-left" title="Align Left"></i>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: text ? "block" : "none"}}
                               onClick={this.props.onClickAlignCenter}> <i className="fa fa-align-center" title="Align Center"></i>
                            </a>

                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: text ? "block" : "none"}}
                               onClick={this.props.onClickAlignRight}> <i className="fa fa-align-right" title="Align Right"></i>
                            </a>
                        </li>

                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display: hub ? "block" : "none"}}>
                                <i className="fa fa-rotate-left" title="Rotate Left"></i>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;"
                               className="option p-none"  style={{display:  hub ? "block" : "none"}}>
                                <i className="fa fa-rotate-right" title="Rotate Right"></i>
                            </a>
                        </li>

                        <li>
                            <a href="javascript:;" onClick={this.toggleLineTypes.bind(this)}
                               className="option p-none" style={{display: line ? "block" : "none"}}>
                                <i className="fa fa-reply" title="Change Type"></i>
                            </a>

                            {this.renderLineTypes()}
                        </li>

                        <li>
                            <a href="javascript:;" onClick={this.props.onClickEdit}
                               className={"option p-none " + (this.props.editable ? "option-active" : "")}>
                                <i className="fa fa-edit"></i>
                            </a>
                        </li>

                        <li className={this.state.displayDevices ? "" : "dropdown"} ref="liDevices">
                            <a href="javascript:" onClick={this.onClickAdd.bind(this)}
                               className={"option p-none " + (this.state.displayDevices ? "option-active" : "")}>
                                <i className="fa fa-plus-square" title="Add"></i>
                            </a>
                            {this.state.displayDevices ?
                                <DeviceMenu onClickItem={this.props.onClickDeviceItem} selectedItem={this.props.selectedItem}/> : null}
                        </li>

                        <li className="dropdown active">
                            <a href="#" data-toggle="dropdown" className="dropdown-toggle" style={{display:"none"}}></a>
                            <ul className="dropdown-menu">
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
    
    renderLineTypes() {

        if (!this.state.displayLineType) return null

        const popover = {
            position: 'absolute',
            zIndex: '2',
            right: "-10px",
            top: "30px",
        }

        const cover = {
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        }

        return (
            <div style={ popover }>
                <div style={ cover } onClick={ this.toggleLineTypes.bind(this) }/>
                <div id="linetypediv" className="panel-group">
                    <div className="panel panel-default">
                        <div className="panel-body"><ul>
                        {
                            this.lineTypes.map(item =>
                                <li key={item.typename}><a href="javascript:;" onClick={this.onClickLineType.bind(this, item)}>
                                    <div className="pull-left item-icon">
                                        <img src={item.image} data-type={item.type} data-typename={item.typename}/>
                                    </div>
                                    <div className="item-text">
                                        <strong>{item.title}</strong>
                                    </div>
                                </a></li>
                            )
                        }
                        </ul></div>
                    </div>
                </div>
            </div>
        )
    }

    /////////////////////////////////////////

    onClickAdd() {
        this.setState({
            displayDevices: !this.state.displayDevices,
        }, () => {
            this.props.onClickAdd(this.state.displayDevices)
        })
    }

    hideDeviceMenu() {
        this.setState({
            displayDevices: false
        })
    }

    /////////////////////////////////////////

    onClickColorPicker() {
        this.setState({ displayColorPicker: !this.state.displayColorPicker })
    }

    onCloseColorPicker() {
        this.setState({ displayColorPicker: false })
    }

    onChangeColorPicker(color) {
        this.props.onChangeLineColor(color.hex)
    }

    /////////////////////////////////////////


    toggleLineTypes() {
        this.setState({ displayLineType: !this.state.displayLineType})
    }

    onClickLineType(item) {
        this.toggleLineTypes()

        var deviceTypeId = item['typeid'];
        var type = item['typename'];
        var imgUrl = item['image'];

        this.props.onChangeLineType(type, imgUrl, deviceTypeId)
    }


    handleClick (e) {

        //Detect device menu outer click
        if (this.state.displayDevices) {
            if (!this.refs.liDevices.contains(e.target)) {
                this.setState({ displayDevices: false }, () => {
                    this.props.onClickAdd(this.state.displayDevices)
                })
            }
        }

    }
}

Toolbar.defaultProps = {
    onClickEdit: null,
    editable: false,

    selectedItem: {},
    onClickDeviceItem: null
}