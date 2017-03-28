import React from 'react'
import { Field } from 'redux-form'
import {FlatButton} from 'material-ui'
import ActionSearch from 'material-ui/svg-icons/action/search'
import ToggleStar from 'material-ui/svg-icons/toggle/star-border'

import { FormInput, FormSelect } from 'components/modal/parts'

export default class SearchFormView extends React.Component {
  render () {
    const { onSearchKeyDown,
      dateOptions,
      onClickStar,
      onSubmit} = this.props

    const options = dateOptions.map((m, index) => {
      return {
        label: m.name,
        value: index
      }
    })
    return (
      <form onSubmit={onSubmit}>
        <div className="text-center margin-md-top" >
          <Field name="query" component={FormInput} label="Search" onKeyDown={onSearchKeyDown} style={{verticalAlign: 'top'}}/>
          <Field name="dateIndex" component={FormSelect} label="" options={options} style={{verticalAlign: 'top'}}/>
          <FlatButton type="submit" icon={<ActionSearch />} style={{marginTop: '4px', verticalAlign: 'top'}}/>
          <FlatButton icon={<ToggleStar />} style={{marginTop: '4px', verticalAlign: 'top'}} onClick={onClickStar}/>
        </div>
      </form>
    )
  }
}
