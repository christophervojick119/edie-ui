import React from 'react'
import {
  ButtonGroup,
  Button
} from 'react-bootstrap'

import SettingTabs from '../SettingTabs'
import TabPage from '../../../../shared/TabPage'
import TabPageBody from '../../../../shared/TabPageBody'
import TabPageHeader from '../../../../shared/TabPageHeader'

import { ResponsiveInfiniteTable } from '../../../../shared/InfiniteTable'
import ParserTypeModalContainer from 'containers/page/content/settings/parserTypes/ParserTypeModalContainer'

class ParserTypes extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}

    this.cells = [{
      'displayName': 'Name',
      'columnName': 'name'
    }, {
      'displayName': 'Filters',
      'columnName': 'filters'
    }]
  }
  componentWillMount () {
    this.props.fetchParserTypes()
  }

  onClickAdd () {
    this.props.openParserTypeModal()
  }

  onClickEdit () {

  }

  renderParserTypeModal () {
    if (!this.props.parserTypeModalOpen) return null
    return (
      <ParserTypeModalContainer />
    )
  }

  render () {
    return (
      <TabPage>
        <TabPageHeader title="Settings">
          <div className="text-center margin-md-top">
            <div style={{position: 'absolute', right: '25px'}}>
              <ButtonGroup>

                <Button onClick={this.onClickAdd.bind(this)}>Add</Button>
                <Button>Edit</Button>
                <Button>Remove</Button>

              </ButtonGroup>
            </div>
          </div>
        </TabPageHeader>

        <TabPageBody tabs={SettingTabs} tab={8}>
          <ResponsiveInfiniteTable
            cells={this.cells}
            ref="table"
            rowMetadata={{'key': 'id'}}
            selectable
            onRowDblClick={this.onClickEdit.bind(this)}

            useExternal={false}
            data={this.props.parserTypes}
          />

          {this.renderParserTypeModal()}
        </TabPageBody>
      </TabPage>
    )
  }
}

export default ParserTypes
