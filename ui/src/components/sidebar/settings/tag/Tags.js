import React from 'react'
import {RaisedButton, Chip, Avatar} from 'material-ui'
import {blue300, indigo900} from 'material-ui/styles/colors'

import {showConfirm} from 'components/common/Alert'

import SettingTabs from '../SettingTabs'
import TabPage from 'components/common/TabPage'
import TabPageBody from 'components/common/TabPageBody'
import TabPageHeader from 'components/common/TabPageHeader'

import TagModal from './TagModal'
import WfTabs from '../rule/WorkflowTabs'

import {chipStyles} from 'style/common/materialStyles'

export default class Tags extends React.Component {
  componentWillMount () {
    this.props.fetchTags()
    this.props.fetchDevices()
  }
  onRowDblClick (item) {
    this.props.showTagModal(true, item)
  }
  onAddTag () {
    this.props.showTagModal(true)
  }
  onEditTag (item) {
    this.props.showTagModal(true, item)
  }
  onDeleteTag (item) {
    showConfirm('Are you sure?', btn => {
      if (btn !== 'ok') return
      this.props.removeTag(item)
    })
  }
  onClickTag (item) {
    const {multiSelTags} = this.props
    const selected = multiSelTags.filter(p => p.id === item.id).length > 0
    const items = !selected ? [...multiSelTags, item] : multiSelTags.filter(p => p.id !== item.id)
    this.props.multiSelectTag(items)
    this.props.fetchItemsByTags(items)
  }

  getTagMonitors () {
    const {multiSelTags} = this.props
    const monitors = []
    this.props.devices.forEach(d => {
      (d.monitors || []).forEach(m => {
        let found = false
        if (m.tags && m.tags.length > 0) {
          for (const i in multiSelTags) {
            if (m.tags.includes(multiSelTags[i].name)) {
              found = true
              break
            }
          }
        }
        if (found) {
          monitors.push(m)
        }
      })
    })
    return monitors
  }

  renderTagModal () {
    if (!this.props.tagModalOpen) return null
    return (
      <TagModal {...this.props}/>
    )
  }
  renderTags () {
    const {tags, multiSelTags} = this.props
    return (
      <div style={chipStyles.wrapper}>
        {tags.map(p =>
          <Chip
            key={p.id}
            style={chipStyles.chip}
            labelStyle={chipStyles.label}
            backgroundColor={multiSelTags.filter(t => t.id === p.id).length ? blue300 : null}
            onTouchTap={this.onClickTag.bind(this, p)}
            onRequestDelete={this.onDeleteTag.bind(this, p)}
          >
            {p.name}
          </Chip>
        )}
      </div>
    )
  }
  renderItems () {
    const {tagDevices, tagWorkflows, tagParserTypes, tagDeviceTpls, tagMonitorTpls} = this.props
    return (
      <div style={chipStyles.wrapper}>
        {tagDevices.map(p =>
          <Chip
            key={p.id} style={chipStyles.chip} labelStyle={chipStyles.label}
            onTouchTap={() => {}}>
            <Avatar color={blue300} backgroundColor={indigo900}>D</Avatar>{p.name}
          </Chip>
        )}
        {this.getTagMonitors().map(p =>
          <Chip
            key={p.uid} style={chipStyles.chip} labelStyle={chipStyles.label}
            onTouchTap={() => {}}>
            <Avatar color={blue300} backgroundColor={indigo900}>M</Avatar>{p.name}
          </Chip>
        )}
        {tagWorkflows.map(p =>
          <Chip
            key={p.id} style={chipStyles.chip} labelStyle={chipStyles.label}
            onTouchTap={() => {}}>
            <Avatar color={blue300} backgroundColor={indigo900}>W</Avatar>{p.name}
          </Chip>
        )}
        {tagParserTypes.map(p =>
          <Chip
            key={p.id} style={chipStyles.chip} labelStyle={chipStyles.label}
            onTouchTap={() => {}}>
            <Avatar color={blue300} backgroundColor={indigo900}>P</Avatar>{p.name}
          </Chip>
        )}
        {tagDeviceTpls.map(p =>
          <Chip
            key={p.id} style={chipStyles.chip} labelStyle={chipStyles.label}
            onTouchTap={() => {}}>
            <Avatar color={blue300} backgroundColor={indigo900}>DT</Avatar>{p.name}
          </Chip>
        )}
        {tagMonitorTpls.map(p =>
          <Chip
            key={p.id} style={chipStyles.chip} labelStyle={chipStyles.label}
            onTouchTap={() => {}}>
            <Avatar color={blue300} backgroundColor={indigo900}>MT</Avatar>{p.name}
          </Chip>
        )}
      </div>
    )
  }
  render () {
    return (
      <TabPage>
        <TabPageHeader title="Tags">
          <div className="text-center margin-md-top">
            <div className="pull-right">
              <RaisedButton label="Add" onTouchTap={this.onAddTag.bind(this)}/>&nbsp;
              <RaisedButton label="Edit" onTouchTap={this.onEditTag.bind(this)}/>&nbsp;
              <RaisedButton label="Delete" onTouchTap={this.onDeleteTag.bind(this)}/>&nbsp;
              <WfTabs history={this.props.history}/>
            </div>
          </div>
        </TabPageHeader>

        <TabPageBody tabs={SettingTabs} tab={5} history={this.props.history} location={this.props.location}>
          <div className="padding-md">
            <div><b>Tags</b></div>
            {this.renderTags()}
            <div>Related</div>
            {this.renderItems()}
          </div>
          {this.renderTagModal()}
        </TabPageBody>
      </TabPage>
    )
  }
}
