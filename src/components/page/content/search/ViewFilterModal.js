import React from 'react'
import {ViewFilterModalView} from 'components/modal'

export default class ViewFilterModal extends React.Component {
  componentWillMount () {
    this.props.selectViewFilter(null)
  }
  onClickOK () {
    const {selectedViewFilter} = this.props
    if (!selectedViewFilter) return window.alert('Please select filter.')
    this.props.updateSearchViewFilter(selectedViewFilter)
    this.onClickClose()
  }
  onClickClose () {
    this.props.showViewFilterModal(false)
  }
  render () {
    return (
      <ViewFilterModalView
        selectedViewFilter={this.props.selectedViewFilter}
        selectViewFilter={this.props.selectViewFilter}
        onClickOK={this.onClickOK.bind(this)}
        onClickClose={this.onClickClose.bind(this)}
      />
    )
  }
}
