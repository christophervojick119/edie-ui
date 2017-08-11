import React from 'react'
import moment from 'moment'
import {findIndex} from 'lodash'
import axios from 'axios'

import { ROOT_URL } from 'actions/config'
import { dateFormat, severities } from 'shared/Global'

import FlipView from './FlipView'
import LineChart from './display/LineChart'
import GEditView from './GEditView'

import {showAlert} from 'components/common/Alert'

const sampleData = []

const chartOptions = {
  legend: {
    display: false
  },
  elements: {
    line: {
      tension: 0
    }
  },
  scales: {
    xAxes: [{
      display: false
    }],
    yAxes: [{
      display: true,
      ticks: {
        min: 0,
        callback: function(value, index, values) {
          if (Math.floor(value) === value) return value
        }
      }
    }]
  }
}

const monitorChartOptions = {
  legend: {
    display: false
  },
  elements: {
    line: {
      tension: 0
    }
  },
  scales: {
    xAxes: [{
      display: false
    }],
    yAxes: [{
      display: true,
      ticks: {
        min: 0,
        callback: function(value, index, values) {
          if (Math.floor(value) === value) return value === 0 ? 'Down' : 'Up'
        }
      }
    }]
  },
  tooltips: {
    mode: 'label',
    callbacks: {
      label: function(tooltipItem, data) {
        const indice = tooltipItem.index;
        return data.datasets[0].data[indice] === 0 ? 'Down' : 'Up'
      }
    }
  }
}

export default class GLineChart extends React.Component {
  constructor (props) {
    super (props)
    this.state = {
      loading: true,
      searchRecordCounts: []
    }
    this.renderBackView = this.renderBackView.bind(this)
    this.renderFrontView = this.renderFrontView.bind(this)
  }

  componentWillMount () {
    this.fetchRecordCount(this.props)
  }

  componentWillUpdate (nextProps) {
    const {gauge, searchList} = nextProps
    if (gauge && JSON.stringify(this.props.gauge) !== JSON.stringify(gauge)) {
      this.fetchRecordCount(nextProps)
    } else if (searchList && JSON.stringify(this.props.searchList) !== JSON.stringify(searchList)) {
      this.fetchRecordCount(nextProps)
    }
  }

  fetchRecordCount (props) {
    const {gauge, searchList} = props
    const {savedSearchId, monitorId, resource, duration, durationUnit, splitBy, splitUnit,workflowId} = gauge

    this.setState({
      loading: true
    })

    let inc = 1
    if (durationUnit === 'month' && splitUnit === 'day') inc = 0
    const dateFrom = moment().add(-duration + inc, `${durationUnit}s`)
      .startOf(durationUnit === 'hour' || duration === 1 ? durationUnit : 'day')
    const dateTo = moment().endOf(durationUnit === 'hour' ? durationUnit : 'day')

    if (resource === 'monitor') {
      axios.get(`${ROOT_URL}/event/search/findByDate`, {
        params: {
          dateFrom: dateFrom.valueOf(),
          dateTo: dateTo.valueOf(),
          monitorId,
          sort: 'timestamp'
        }
      }).then(res => {
        this.setState({
          searchRecordCounts: res.data._embedded.events.map(p => ({
            date: moment(p.timestamp).format('YYYY-MM-DD HH:mm:ss'),
            count: p.eventType === 'AGENT' || (p.lastResult && p.lastResult.status === 'UP') ? 1 : 0
          })),
          loading: false
        })
      })
    } else if (resource === 'incident'){
      const searchParams = {
        query: '',
        workflow: workflowId,
        collections: 'incident',
        severity: severities.map(p => p.value).join(','),
        tag: '',
        monitorTypes: ''
      }
      const params = { ...searchParams, splitBy, splitUnit,
        dateFrom: dateFrom.format(dateFormat),
        dateTo: dateTo.format(dateFormat)
      }
      axios.get(`${ROOT_URL}/search/getRecordCount`, {params}).then(res => {
        this.setState({
          searchRecordCounts: res.data,
          loading: false
        })
      })
    } else {
      const index = findIndex(searchList, {id: savedSearchId})
      if (index < 0) {
        console.log('Saved search not found.')
        return
      }
      const searchParams = JSON.parse(searchList[index].data)

      const params = { ...searchParams, splitBy, splitUnit,
        dateFrom: dateFrom.format(dateFormat),
        dateTo: dateTo.format(dateFormat)
      }
      axios.get(`${ROOT_URL}/search/getRecordCount`, {params}).then(res => {
        this.setState({
          searchRecordCounts: res.data,
          loading: false
        })
      })
    }
  }

  onSubmit (options, values) {
    console.log(values)

    if (!values.name) {
      showAlert('Please type name.')
      return
    }
    const gauge = {
      ...this.props.gauge,
      ...values
    }

    this.props.updateDeviceGauge(gauge, this.props.device)
    options.onClickFlip()
  }

  onClickDelete () {
    this.props.removeDeviceGauge(this.props.gauge, this.props.device)
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  renderFrontView () {
    const {gauge} = this.props
    const {searchRecordCounts} = this.state

    const chartData = {
      labels: (searchRecordCounts || sampleData).map(p => p.date),
      datasets: [{
        data: (searchRecordCounts || sampleData).map(p => p.count),
        borderWidth: 1,
        borderColor: '#269C8B',
        fill: false
      }]
    }

    return (
      <div className="flex-vertical flex-1" style={{overflow: 'hidden'}}>
        <div className="flex-1 padding-xs">
          <LineChart chartData={chartData} chartOptions={gauge.resource === 'monitor' ? monitorChartOptions : chartOptions} />
        </div>
      </div>
    )
  }
  renderBackView (options) {
    return (
      <div>
        <GEditView
          {...this.props}
          onSubmit={this.onSubmit.bind(this, options)}
        />
      </div>
    )
  }
  render () {
    return (
      <FlipView
        {...this.props}

        style={this.props.style}
        className={this.props.className}
        gauge={this.props.gauge}

        loading={this.state.loading}
        renderFrontView={this.renderFrontView}
        renderBackView={this.renderBackView}

        onClickDelete={this.onClickDelete.bind(this)}
      />
    )
  }
}
