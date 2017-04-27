import React from 'react'
import ReactDOM from 'react-dom'
import Griddle from 'griddle-react'
import { concat, assign, isEqual, keys } from 'lodash'
import ReduxInfiniteScroll from 'redux-infinite-scroll'

import $ from 'jquery'
import { encodeUrlParams } from 'shared/Global'
import { ROOT_URL } from '../../actions/config'

class InfiniteTable extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentPage: -1,
      isLoading: false,
      maxPages: 0,
      results: [],
      total: 0,
      hasMore: true,

      selected: []
    }

    this.defaultRowMetaData = {
      'bodyCssClassName': this.getBodyCssClassName.bind(this)
    }

    this.lastRequest = null
  }

  componentWillMount () {
    const {onUpdateCount} = this.props
    onUpdateCount && onUpdateCount(0)
  }

  componentDidMount () {
    // if (this.props.useExternal) {
    //   this.getExternalData()
    // }

    this.domNode = ReactDOM.findDOMNode(this.refs.griddle)
    $(this.domNode).on('dblclick', 'tbody tr', (e) => {
      const index = $(e.target).closest('tr').index()
      const data = this.getCurrentData()
      if (data && data[index]) {
        let row = { props: { data: data[index] } }
        this.onRowClick(row)
        this.onRowDblClick(row)
      }
    })
  }

  componentDidUpdate (prevProps, prevState) {
    const {url, params} = this.props
    if (url !== prevProps.url || !isEqual(params, prevProps.params)) {
      this.refresh()
    }
  }

  componentWillUnmount () {
    $(this.domNode).off('dblclick')
    if (this.lastRequest) {
      this.lastRequest.abort()
      this.lastRequest = null
    }
  }

  getCurrentData () {
    return this.props.useExternal ? this.state.results : this.props.data
  }

  getCountPerPage () {
    return Math.max(this.props.useExternal ? this.state.results.length : this.props.data.length, this.props.pageSize)
  }

  getExternalData (page, clear) {
    // if (this.state.isLoading) {
    //   console.log('Already loading.')
    //   return
    // }

    const {url, params, pageSize, onUpdateCount} = this.props
    if (!url) return
    page = clear ? 1 : (page || 1)
    let urlParams = assign({
      page: page - 1,
      size: pageSize || 10
    }, params)

    this.setState({
      isLoading: true
    })

    if (this.lastRequest) {
      this.lastRequest.abort()
    }

    this.lastRequest = $.get(`${ROOT_URL}${url}?${encodeUrlParams(urlParams)}`).done(res => {
      const embedded = res._embedded
      const data = embedded[keys(embedded)[0]]

      const total = res.page.totalElements
      let state = {
        results: concat((clear ? [] : this.state.results), data),
        currentPage: page - 1,
        maxPages: res.page.totalPages,
        total,
        isLoading: false,
        hasMore: data.length > 0
      }

      this.setState(state)
      onUpdateCount && onUpdateCount(total)
    })

    return this.lastRequest
  }

  getBodyCssClassName (data) {
    if (!this.props.selectable) return ''
    if (this.state.selected.indexOf(data[this.props.rowMetadata.key]) >= 0) return 'selected'
    return ''
  }

  getTotalCount () {
    return this.state.useExternal ? this.state.total : this.props.data.length
  }

  onRowClick (row) {
    if (!this.props.selectable) return
    this.setState({
      selected: [row.props.data[this.props.rowMetadata.key]]
    })
  }

  onRowDblClick (row) {
    if (!this.props.selectable) return
    this.setState({
      selected: [row.props.data[this.props.rowMetadata.key]]
    }, () => {
      this.props.onRowDblClick &&
      this.props.onRowDblClick(this.getSelected())
    })
  }

  getSelectedIndex () {
    let found = -1
    const results = this.getCurrentData()
    results.forEach((item, i) => {
      if (this.state.selected.indexOf(item[this.props.rowMetadata.key]) >= 0) {
        found = i
        return false
      }
    })
    return found
  }
  getSelected () {
    let found = null
    const results = this.getCurrentData()
    results.forEach(item => {
      if (this.state.selected.indexOf(item[this.props.rowMetadata.key]) >= 0) {
        found = item
        return false
      }
    })
    return found
  }

  refresh () {
    if (this.props.useExternal) {
      this.setState({
        hasMore: true
      })
      this.getExternalData(1, true)
    }
  }

  loadMore () {
    if (!this.state.hasMore) return
    this.getExternalData(this.state.currentPage + 2)
  }

  getBodyHeight () {
    return parseInt(this.props.bodyHeight || '0')
  }

  renderTable () {
    const rowMetadata = assign({}
      , this.defaultRowMetaData
      , this.props.rowMetadata || {})
    const bodyHeight = this.getBodyHeight()
    return (
      <Griddle
        key="0"
        id={this.props.id}
        useExternal={false}
        enableSort={false}

        columns={this.props.cells.map(item => item.columnName)}
        columnMetadata={this.props.cells}
        rowMetadata={rowMetadata}
        rowHeight={this.props.rowHeight}
        bodyHeight={bodyHeight || null}
        showTableHeading={this.props.showTableHeading}

        results={this.getCurrentData()}
        resultsPerPage={this.getCountPerPage()}

        tableClassName="table table-hover table-panel"

        useFixedHeader={false}
        noDataMessage={this.props.noDataMessage}
        useGriddleStyles={false}

        onRowClick={this.onRowClick.bind(this)}

        onRowDblClick={this.onRowDblClick.bind(this)}
        ref="griddle"
      />
    )
  }

  render () {
    const table = this.renderTable()
    if (!this.props.bodyHeight) {
      return (
        <ReduxInfiniteScroll
          children={[table]}
          loadMore={this.loadMore.bind(this)}
          loadingMore={this.state.isLoading}
        />
      )
    }
    return table
  }
}

InfiniteTable.defaultProps = {
  id: null,
  url: '',
  params: null,
  cells: [],
  useExternal: true,
  data: [],

  pageSize: 20,
  rowMetadata: {},
  rowHeight: 50,
  showTableHeading: true,

  selectable: false,
  noDataMessage: ''
}

export default InfiniteTable
