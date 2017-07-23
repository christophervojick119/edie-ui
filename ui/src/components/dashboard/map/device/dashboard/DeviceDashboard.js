import React from 'react'
import {concat, assign} from 'lodash'

import GaugeView from './GaugeView'

const params = {
  dateFrom: '20/07/2017 00:00:00',
  dateTo: '23/07/2017 23:59:59'
}
export default class DeviceDashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  componentWillMount () {
    this.props.fetchGroupDevicesAndLines(this.props.device.id)
    this.props.fetchSysSearchOptions()
  }

  getGauges () {
    const {mapDevices} = this.props
    return mapDevices/*.filter(p => p.params && !!p.params.graph)*/
  }

  getUserSearchOptions () {
    const {userInfo} = this.props
    if (!userInfo) return []
    const {searchOptions} = userInfo
    if (!searchOptions) return []
    try {
      return JSON.parse(searchOptions)
    } catch (e) {
      console.log(e)
    }
    return []
  }

  getSearchList () {
    const {sysSearchOptions} = this.props
    return concat([], this.getUserSearchOptions().map(p => {
      return assign({}, p, {
        type: 'User'
      })
    }), sysSearchOptions.map(p => {
      return assign({}, p, {
        type: 'System'
      })
    }))
  }

  // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  renderGauge (p) {
    return (
      <div className="col-md-6 margin-sm-bottom" key={p.id}>
        <div className="panel panel-blue">
          <div className="panel-heading">
            <h4 className="panel-title">{p.name}</h4>
          </div>
          <div className="panel-body">
            <GaugeView queryChips={[]} params={params}/>
          </div>
        </div>
      </div>
    )
  }
  render () {
    return (
      <div className="padding-md-top">
        {this.getGauges().map(p => this.renderGauge(p))}
      </div>
    )
  }
}
