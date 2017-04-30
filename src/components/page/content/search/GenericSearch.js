import React from 'react'
import { reduxForm, submit, formValueSelector } from 'redux-form'
import { connect } from 'react-redux'
import { merge, assign, concat, isArray, keys } from 'lodash'
import moment from 'moment'
import {Popover, FlatButton, Chip} from 'material-ui'
import NavigationClose from 'material-ui/svg-icons/navigation/close'
import {browserHistory} from 'react-router'

import InfiniteTable from 'components/shared/InfiniteTable'
import SearchTabs from './SearchTabs'
import TabPage from '../../../shared/TabPage'
import TabPageBody from '../../../shared/TabPageBody'
import TabPageHeader from '../../../shared/TabPageHeader'
import { imageBaseUrl, parseSearchQuery, guid, encodeUrlParams, dateFormat, convertSearchParams } from 'shared/Global'
import { showConfirm } from 'components/shared/Alert'

import SearchFormView from './SearchFormView'
import SearchSavePopover from './SearchSavePopover'
import WorkflowSelectModal from './WorkflowSelectModal'
import SavedSearchModal from './SavedSearchModal'
import RelDevicesModal from './RelDevicesModal'

const styles = {
  chip: {
    margin: 4
  },
  chipLabel: {
    fontSize: '12px'
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    maxHeight: '300px',
    overflow: 'auto'
  }
}

const collections = [
  {label: 'incident', value: 'incident'},
  {label: 'event', value: 'event'}
]
const severities = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
  { label: 'Audit', value: 'AUDIT' },
  { label: 'Ignore', value: 'IGNORE' }
]
class GenericSearch extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      total: 0
    }
    this.cells = [{
      'displayName': ' ',
      'columnName': 'entity.id',
      'customComponent': (props) => {
        const {rowData} = props
        if (!rowData.entity) return <span/>

        // const data = this.getHighlighted(rowData.entity, rowData.highlights)
        // return <span dangerouslySetInnerHTML={{ __html: data }} /> // eslint-disable-line

        return this.renderData(this.getHighlighted(rowData.entity, rowData.highlights), false, rowData.type)
      }
    }]
  }

  componentWillMount () {
    const {filterType} = this.props.location.state || {}
    const {q} = this.props.location.query || {}
    let params = assign({}, this.props.params)

    if (q) {
      try {
        const parsed = JSON.parse(q)
        const {query} = parsed
        const queryChips = parseSearchQuery(query)
        params = assign(params, parsed)

        this.props.updateSearchParams(params)
        this.props.replaceSearchWfs([])
        this.props.updateQueryChips(queryChips)
        this.props.change('query', '')
        this.props.change('searchOptionIndex', '')
      } catch (e) {}
    } else if (filterType) {
      let query = ''
      if (filterType === 'today') {
        params.dateFrom = moment().startOf('day').valueOf()
        params.dateTo = moment().endOf('day').valueOf()
      } else if (filterType === 'month') {
        params.dateFrom = moment().startOf('month').valueOf()
        params.dateTo = moment().endOf('month').valueOf()
      } else if (filterType === 'open') {
        params.dateFrom = moment().startOf('year').valueOf()
        params.dateTo = moment().endOf('year').valueOf()
        query = 'fixed=false'
      }
      const queryChips = parseSearchQuery(query)

      params = assign(params, {
        query,
        severity: 'HIGH,MEDIUM,LOW,AUDIT,IGNORE',
        collections: 'incident',
        workflow: ''
      })

      this.props.updateSearchParams(params)
      this.props.replaceSearchWfs([])
      this.props.updateQueryChips(queryChips)
      this.props.change('query', '')
      this.props.change('searchOptionIndex', '')
    }
    this.props.fetchSearchFields(params)

    this.props.fetchWorkflows()
  }

  getSearchOptions () {
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

  renderValue (val) {
    let startChar, endChar
    let children = []
    if (typeof val === 'object' && val !== null) {
      startChar = isArray(val) ? '[' : '{'
      endChar = isArray(val) ? ']' : '}'

      if (isArray(val)) {
        val.forEach((item, index) => {
          children.push(this.renderValue(item))
          if (index < val.length - 1) children.push(<div className="field-separator"/>)
        })
      } else {
        children = this.renderData(val, true)
      }

      return concat([],
        <span className="field-key">{startChar}&nbsp;</span>,
        children,
        <span className="field-key">&nbsp;{endChar}</span>
      )
    }

    const html = JSON.stringify(val).replace(/(\\t)|(\\r)|(\\n)/gi, ' ')

    return (
      <span className="field-value" dangerouslySetInnerHTML={{ __html: html }}/> // eslint-disable-line
    )
  }

  renderData (entity, isChildren, type) {
    let children = []
    const allKeys = type ? concat([], 'type', keys(entity)) : keys(entity)
    const newEntity = type ? assign({}, entity, {type}) : entity
    allKeys.forEach((key, index) => {
      children.push(<span className="field-key">{key} = </span>)
      children = concat(children, this.renderValue(newEntity[key]))
      if (index < allKeys.length - 1) children.push(<div className="field-separator"/>)
    })
    if (isChildren) return children
    return <div className="inline">{children}</div>
  }

  getHighlighted (entity, highlights) {
    let data = merge({}, entity)
    keys(highlights).forEach(path => {
      const highlighted = highlights[path]
      const pathElements = path.split('.')

      let el = data
      pathElements.forEach((pathEl, index) => {
        if (index === pathElements.length - 1) {
          if (isArray(el[pathEl])) {
            el = el[pathEl]
            el.forEach((item, index) => {
              if (highlighted.match(item)) el[index] = highlighted
            })
          } else {
            el[pathEl] = highlighted
          }
        } else {
          el = el[pathEl]
          if (isArray(el)) el = el[0]
        }
      })
    })

    return data
  }

  onSearchKeyDown (e) {
    if (e.keyCode === 13) {
      submit('genericSearchForm')
    }
  }

  onRowDblClick () {

  }

  handleFormSubmit (values) {
    const { queryChips } = this.props
    const { query } = values

    const newChips = parseSearchQuery(query)
    const newQueryChips = concat([], queryChips, newChips)

    this.props.updateQueryChips(newQueryChips)

    const newQuery = newQueryChips.map(m => `${m.name}=${m.value}`).join(' and ')
    const params = assign({}, this.props.params, {
      query: newQuery
    })
    this.props.updateSearchParams(params, true)

    this.props.change('query', '')
    browserHistory.replace({
      pathname: '/search',
      search: `?${encodeUrlParams({q: JSON.stringify(params)})}`
    })
  }

  getTypeChar (type) {
    switch (type) {
      case 'long':
      case 'boolean':
      case 'int':
        return '#'
    }
    return 'a'
  }

  handleRequestClose () {
    this.props.closeFieldsPopover()
  }

  onClickField (field, e) {
    this.props.fetchFieldTopValues(field.path, this.props.params)
    this.props.openFieldsPopover(field, e.target)
  }

  onClickValue (value) {
    const { selectedField, params, queryChips } = this.props

    if (!selectedField) return
    this.props.closeFieldsPopover()
    this.props.change('query', '')

    const newQueryChips = concat([], queryChips, {name: selectedField.path, value})
    this.props.updateQueryChips(newQueryChips)
    this.props.updateSearchParams(assign({}, params, {
      query: newQueryChips.map(m => `${m.name}=${m.value}`).join(' and ')
    }))
  }

  onClickChip (index) {
    const chip = this.props.queryChips[index]
    const newQueryChips = this.props.queryChips.filter((p, i) => i !== index)
    this.props.updateQueryChips(newQueryChips)

    const query = chip.name === '_all' ? chip.value : `${chip.name}=${chip.value}`
    this.props.change('query', query)
  }

  onClickRemoveChip (index) {
    const newQueryChips = this.props.queryChips.filter((p, i) => i !== index)
    this.props.updateQueryChips(newQueryChips)
    this.props.updateSearchParams(assign({}, this.props.params, {
      query: newQueryChips.map(m => `${m.name}=${m.value}`).join(' and ')
    }))
  }

  onClickStar (e) {
    const { userInfo, selectedSearchOption, change, removeSearchOption, openSearchSavePopover } = this.props

    const searchOptions = this.getSearchOptions()
    if (selectedSearchOption) {
      const found = searchOptions.filter(i => i.id === selectedSearchOption)
      if (userInfo && found.length) {
        showConfirm('Click OK to remove.', (btn) => {
          if (btn !== 'ok') return
          change('searchOptionIndex', '')
          removeSearchOption(userInfo, found[0])
        })
      }
    } else {
      openSearchSavePopover(null, e.target)
    }
  }

  onClickSaveSearch (values) {
    const { userInfo, params } = this.props
    if (!userInfo) return
    const option = {
      id: guid(),
      name: values.name,
      data: JSON.stringify(params)
    }

    this.props.closeSearchSavePopover()
    this.props.addSearchOption(userInfo, option)
  }

  onChangeSearchOption (selectedSearch) {
    let found
    try {
      found = JSON.parse(selectedSearch.data)
    } catch (e) {
      found = {}
    }

    const newQueryChips = parseSearchQuery(found.query || '')
    const params = assign({}, this.props.params, found)
    params.workflow = ''

    this.props.updateSearchParams(params)
    this.props.updateQueryChips(newQueryChips)
    this.props.replaceSearchWfs([])
    this.props.change('query', '')
  }

  onClickWorkflow () {
    this.props.openSearchWfModal()
  }

  onClearWorkflow () {
    this.props.selectSearchWf('')
    this.props.updateSearchParams(assign({}, this.props.params, {
      workflow: ''
    }))
  }

  onClickSelectWorkflow () {
    if (!this.props.selectedRowWf) return
    this.props.addSearchWf(this.props.selectedRowWf)
    this.props.updateSearchParams(assign({}, this.props.params, {
      workflow: concat([], this.props.selectedWfs, this.props.selectedRowWf).map(m => m.id).join(',')
    }))
    this.props.closeSearchWfModal()
  }

  onClickRemoveWfChip (index) {
    const wf = this.props.selectedWfs[index]
    this.props.removeSearchWf(wf)
    this.props.updateSearchParams(assign({}, this.props.params, {
      workflow: this.props.selectedWfs.filter(m => m.id !== wf.id).map(m => m.id).join(',')
    }))
  }

  onChangeCollection (e, index, values) {
    if (!values.length) {
      return
    }
    this.props.updateSearchParams(assign({}, this.props.params, {
      collections: values.join(',')
    }))
  }

  onChangeSeverity (e, index, values) {
    this.props.updateSearchParams(assign({}, this.props.params, {
      severity: values.join(',')
    }))
  }

  onChangeRange ({startDate, endDate}) {
    this.props.updateSearchParams(assign({}, this.props.params, {
      dateFrom: startDate.format(dateFormat),
      dateTo: endDate.format(dateFormat)
    }))
  }

  onResultCountUpdate (total) {
    this.setState({total})
  }

  onClickIllustrate () {
    this.props.showThreats(this.props.params)
    const {router} = this.props
    router.push({
      pathname: '/threatmap',
      query: {
        mode: 'replay'
      }
    })
  }
  onClickSavedSearch () {
    this.props.showSavedSearch(true)
  }
  onClickRelDevices (e) {
    this.props.showRelDevicesPopover(true, e.target)
    this.props.fetchRelDevices(this.props.params)
  }
  renderFields () {
    const {selectedField} = this.props
    return (
      <div className="padding-sm" style={{position: 'absolute', height: '100%', minWidth: '100%'}}>
        <div className="header-blue">Fields</div>
        {this.props.fields.map(f =>
          <div key={f.path} className={`field-item margin-xs-top ${selectedField && selectedField.path === f.path ? 'selected' : ''}`}>
            <span className="margin-sm-right text-gray">{this.getTypeChar(f.type)}</span>
            <a href="javascript:;" onClick={this.onClickField.bind(this, f)}>{f.path.replace(/\.dataobj\./gi, '.').replace(/dataobj\./gi, '')}</a>
            <span className="margin-sm-left text-gray">{f.count}</span>
          </div>
        )}
      </div>
    )
  }

  renderSavePopover () {
    const { savePopoverOpen, anchorEl, closeSearchSavePopover } = this.props
    if (!savePopoverOpen) return
    return (
      <SearchSavePopover
        anchorEl={anchorEl}
        onRequestClose={closeSearchSavePopover}
        onSubmit={this.onClickSaveSearch.bind(this)}
      />
    )
  }
  renderRelDevicesPopover () {
    if (!this.props.relDevicePopoverOpen) return null
    return (
      <RelDevicesModal {...this.props}/>
    )
  }
  renderFieldPopover () {
    const { selectedField, fieldPopoverOpen, anchorEl } = this.props
    if (!selectedField) return
    return (
      <Popover
        open={fieldPopoverOpen}
        anchorEl={anchorEl}
        anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
        canAutoPosition
        style={{marginLeft: '100px'}}
        onRequestClose={this.handleRequestClose.bind(this)}
      >
        <div className="padding-md-left">
          <div className="inline-block padding-sm">
            <h4>{selectedField.path}</h4>
          </div>
          <div className="pull-right padding-sm">
            <FlatButton icon={<NavigationClose />} style={{minWidth: '44px'}} onTouchTap={this.handleRequestClose.bind(this)}/>
          </div>
        </div>

        <hr className="m-none" style={{borderColor: 'gray'}}/>

        <div className="padding-md-left padding-md-top">
          <div className="inline padding-sm">
            {selectedField.count} Values
          </div>
        </div>

        <div className="padding-md-left padding-lg-top">
          <div className="padding-sm">
            <b>Reports</b>
          </div>
          <div className="padding-sm">
            <div>
              <div className="col-md-4"><a href="javascript:;">Top values</a></div>
              <div className="col-md-4"><a href="javascript:;">Top values by time</a></div>
              <div className="col-md-4"><a href="javascript:;">Rare values</a></div>
              <div className="col-md-4"><a href="javascript:;">Events with this field</a></div>
            </div>

          </div>
        </div>

        <div style={{height: '400px', width: '100%', overflowY: 'auto', overflowX: 'hidden'}}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th><b>Top 10 Values</b></th>
                <th>Count</th>
                <th>%</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
            {
              this.props.fieldTopValues.map(m =>
                <tr key={m.name}>
                  <td>
                    <a href="javascript:;" onClick={this.onClickValue.bind(this, m.name)}>{m.name}</a>
                  </td>
                  <td>{m.count}</td>
                  <td>{(m.percent || 0).toFixed(2)}%</td>
                  <td>
                    <div style={{width: '200px'}}>
                      <img src={`${imageBaseUrl}bar.png`} width={`${Math.max(m.percent || 0, 0.5)}%`} height="16"/>
                    </div>
                  </td>
                </tr>
              )
            }
            </tbody>
          </table>
        </div>
      </Popover>
    )
  }

  renderWfSelectModal () {
    if (!this.props.wfModalOpen) return
    return (
      <WorkflowSelectModal {...this.props} onClickOK={this.onClickSelectWorkflow.bind(this)}/>
    )
  }

  renderSavedSearchModal () {
    if (!this.props.savedSearchModalOpen) return
    return (
      <SavedSearchModal
        {...this.props}
        onChangeSearchOption={this.onChangeSearchOption.bind(this)}
        userOptions={this.getSearchOptions()}
      />
    )
  }

  render () {
    const { handleSubmit, selectedWf, params } = this.props
    const { severity, dateFrom, dateTo } = params
    const selectedCollections = params.collections
    const workflow = this.props.workflows.filter(m => m.id === selectedWf)

    return (
      <TabPage>
        <TabPageHeader title="Search">
          <SearchFormView
            onSearchKeyDown={this.onSearchKeyDown.bind(this)}
            onClickStar={this.onClickStar.bind(this)}
            starFilled={!!this.props.selectedSearchOption}
            workflow={workflow.length ? workflow[0].name : ''}
            collections={collections}
            selectedCollections={selectedCollections ? selectedCollections.split(',') : []}
            onChangeCollection={this.onChangeCollection.bind(this)}
            onClearWorkflow={this.onClearWorkflow.bind(this)}
            onClickWorkflow={this.onClickWorkflow.bind(this)}
            onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}
            severities={severities}
            selectedSeverities={severity.split(',')}
            onChangeSeverity={this.onChangeSeverity.bind(this)}
            startDate={dateFrom}
            endDate={dateTo}
            onChangeDateRange={this.onChangeRange.bind(this)}
            onClickIllustrate={this.onClickIllustrate.bind(this)}
            onClickSavedSearch={this.onClickSavedSearch.bind(this)}
            onClickRelDevices={this.onClickRelDevices.bind(this)}
          />

          <div className="text-center">
            <div className="inline">
              <div style={styles.wrapper}>
                {this.props.queryChips.map((p, i) =>
                  <Chip
                    key={`${p.name}${p.value}`}
                    style={styles.chip}
                    onTouchTap={this.onClickChip.bind(this, i)}
                    onRequestDelete={this.onClickRemoveChip.bind(this, i)}>
                    {p.name !== '_all' ? <b>{p.name}: </b> : null}{p.value}
                  </Chip>
                )}
                {this.props.selectedWfs.map((p, i) =>
                  <Chip
                    key={p.id}
                    style={styles.chip}
                    onRequestDelete={this.onClickRemoveWfChip.bind(this, i)}>
                    <b>Workflow: </b>{p.name}
                  </Chip>
                  )}
              </div>
            </div>

            {this.renderRelDevicesPopover()}
            {this.renderSavePopover()}
            {this.renderWfSelectModal()}
            {this.renderSavedSearchModal()}
          </div>

        </TabPageHeader>

        <TabPageBody tabs={SearchTabs} tab={0}>
          <div className="flex-horizontal" style={{height: '100%'}}>
            <div style={{minWidth: '170px', height: '100%', overflow: 'auto', position: 'relative'}}>
              {this.renderFields()}
              {this.renderFieldPopover()}
            </div>
            <div className="flex-1 flex-vertical padding-sm">
              <div className="header-red">
                Content
                <div className="pull-right">
                  Total: {this.state.total}
                </div>
              </div>
              <div className="flex-1">
                <InfiniteTable
                  url="/search/all"
                  cells={this.cells}
                  ref="table"
                  rowMetadata={{'key': 'id'}}
                  selectable
                  onRowDblClick={this.onRowDblClick.bind(this)}
                  params={convertSearchParams(this.props.params)}
                  pageSize={10}
                  showTableHeading={false}
                  onUpdateCount={this.onResultCountUpdate.bind(this)}
                />
              </div>
            </div>
          </div>
        </TabPageBody>
      </TabPage>
    )
  }
}

const GenericSearchForm = reduxForm({form: 'genericSearchForm'})(GenericSearch)
const selector = formValueSelector('genericSearchForm')

export default connect(
  state => ({
    initialValues: assign({}, state.search.params, {query: ''}),
    selectedSearchOption: selector(state, 'searchOptionIndex')
  })
)(GenericSearchForm)
