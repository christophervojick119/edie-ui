import React from 'react'
import { connect } from 'react-redux'
import {withRouter} from 'react-router'

import Tags from 'components/sidebar/settings/tag/Tags'

import {
  showTagModal,
  addTag,
  updateTag,
  removeTag
} from 'actions'

class TagsContainer extends React.Component {
  render () {
    return (
      <Tags {...this.props}/>
    )
  }
}

export default connect(
  state => ({
    tagDraw: state.tag.tagDraw,
    tagModalOpen: state.tag.tagModalOpen,
    editTag: state.tag.editTag
  }), {
    showTagModal,
    addTag,
    updateTag,
    removeTag
  }
)(withRouter(TagsContainer))
