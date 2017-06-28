/**
 * This is a container component for ChallengeFiltersExample.
 * It represents community-challenge-listing page.
 *
 * ChallengeFiltersExample component was brought from another project with different approach
 * and it takes care about everything it needs by itself.
 * So this container components almost doing nothing now.
 * Though this component defines a master filter function
 * which is used to define which challenges should be listed for the certain community.
 */

// import _ from 'lodash';
import actions from 'actions/challenge-listing';
import filterPanelActions from 'actions/challenge-listing/filter-panel';
import headerActions from 'actions/topcoder_header';
import logger from 'utils/logger';
import React from 'react';
import PT from 'prop-types';
import shortid from 'shortid';
import { connect } from 'react-redux';
import ChallengeListing from 'components/challenge-listing';
import Banner from 'components/tc-communities/Banner';
import NewsletterSignup from 'components/tc-communities/NewsletterSignup';
import sidebarActions from 'actions/challenge-listing/sidebar';
import { BUCKETS } from 'utils/challenge-listing/buckets';
import style from './styles.scss';

let mounted = false;

class ListingContainer extends React.Component {

  constructor(props) {
    super(props);
    this.masterFilterFunc = this.masterFilterFunc.bind(this);
  }

  componentDidMount() {
    this.props.markHeaderMenu();

    if (mounted) {
      logger.error('Attempt to mount multiple instances of ChallengeListingPageContainer at the same time!');
    } else mounted = true;
    this.loadChallenges();
  }

  componentDidUpdate(prevProps) {
    const token = this.props.auth.tokenV3;
    if (token) {
      if (!prevProps.auth.tokenV3) setImmediate(() => this.loadChallenges());
    } else if (prevProps.auth.tokenV3) {
      setImmediate(() => {
        this.props.dropChallenges();
        this.loadChallenges();
      });
    }
  }

  componentWillUnmount() {
    if (mounted) mounted = false;
    else {
      logger.error('A mounted instance of ChallengeListingPageContainer is not tracked as mounted!');
    }
  }

  loadChallenges() {
    this.props.getAllActiveChallenges(this.props.auth.tokenV3);
    this.props.getDraftChallenges(0, this.props.auth.tokenV3);
    this.props.getPastChallenges(0, this.props.auth.tokenV3);
  }

  /**
   * It takes one challenge object and check if it passes master filter
   * which defines which challenges should be displayed for the current community
   *
   * @param  {Object}  challenge object
   * @return {boolean} whether the item pass filter or not
   */
  masterFilterFunc(item) {
    let keyword;

    // if there is tag in props, use it as keyword
    if (this.props.tag) {
      keyword = this.props.tag;

    // if there is defined keyword param in the route, use it as keyword
    } else if (this.props.match && this.props.match.params && this.props.match.params.keyword) {
      keyword = this.props.match.params.keyword;

    // if keyword is not defined at all, don't filter
    } else {
      return true;
    }

    const techs = ` ${item.technologies.toLowerCase()} `;

    return !!(techs.indexOf(` ${keyword.toLowerCase()} `) >= 0);
  }

  render() {
    const {
      auth: {
        tokenV3,
      },
      allDraftChallengesLoaded,
      allPastChallengesLoaded,
      activeBucket,
      challenges,
      challengeSubtracks,
      challengeTags,
      challengeGroupId,
      getDraftChallenges,
      getPastChallenges,
      lastRequestedPageOfDraftChallenges,
      lastRequestedPageOfPastChallenges,
      listingOnly,
      selectBucket,
    } = this.props;

    let loadMoreDraft;
    if (!allDraftChallengesLoaded) {
      loadMoreDraft = () =>
        getDraftChallenges(1 + lastRequestedPageOfDraftChallenges, tokenV3);
    }

    let loadMorePast;
    if (!allPastChallengesLoaded) {
      loadMorePast = () =>
        getPastChallenges(1 + lastRequestedPageOfPastChallenges, tokenV3);
    }

    return (
      <div>
        {/* For demo we hardcode banner properties so we can disable max-len linting */}
        {/* eslint-disable max-len */}
        { !listingOnly ? (
          <Banner
            title="Challenges"
            text="Browse our available challenges and compete. Vestibulum rutrum quam vitae fringilla tincidunt. Suspendisse nec tortor urna. Ut laoreet sodales nisi, quis iaculis nulla iaculis vitae. Donec sagittis faucibus lacus eget blandit. "
            theme={{
              container: style.bannerContainer,
              content: style.bannerContent,
              contentInner: style.bannerContentInner,
            }}
            imageSrc="/themes/wipro/challenges/banner.jpg"
          />
        ) : null
        }
        {/* eslint-enable max-len */}
        <ChallengeListing
          activeBucket={activeBucket}
          challenges={challenges}
          challengeSubtracks={challengeSubtracks}
          challengeTags={challengeTags}
          communityName={this.props.communityName}
          filterState={this.props.filter}
          loadingChallenges={Boolean(this.props.loadingActiveChallengesUUID)}
          loadingDraftChallenges={Boolean(this.props.loadingDraftChallengesUUID)}
          loadingPastChallenges={Boolean(this.props.loadingPastChallengesUUID)}
          selectBucket={selectBucket}
          loadMoreDraft={loadMoreDraft}
          loadMorePast={loadMorePast}
          setFilterState={(state) => {
            this.props.setFilter(state);
            this.props.setSearchText(state.text || '');
            if (activeBucket === BUCKETS.SAVED_FILTER) {
              this.props.selectBucket(BUCKETS.ALL);
            }
          }}
          setSort={this.props.setSort}
          sorts={this.props.sorts}

          /* OLD PROPS BELOW */
          challengeGroupId={challengeGroupId}
          filterFromUrl={this.props.location.hash}
          masterFilterFunc={this.masterFilterFunc}
          isAuth={!!this.props.auth.user}
          auth={this.props.auth}
        />
        { !listingOnly ? (
          <NewsletterSignup
            title="Sign up for our newsletter"
            text="Don’t miss out on the latest Topcoder IOS challenges and information!"
            imageSrc="/themes/wipro/subscribe-bg.jpg"
          />
        ) : null }
      </div>
    );
  }
}

ListingContainer.defaultProps = {
  challengeGroupId: '',
  communityName: null,
  listingOnly: false,
  match: null,
  tag: null,
};

ListingContainer.propTypes = {
  auth: PT.shape({
    tokenV3: PT.string,
    user: PT.shape(),
  }).isRequired,
  allDraftChallengesLoaded: PT.bool.isRequired,
  allPastChallengesLoaded: PT.bool.isRequired,
  challenges: PT.arrayOf(PT.shape({})).isRequired,
  challengeSubtracks: PT.arrayOf(PT.string).isRequired,
  challengeTags: PT.arrayOf(PT.string).isRequired,
  dropChallenges: PT.func.isRequired,
  filter: PT.shape().isRequired,
  communityName: PT.string,
  getAllActiveChallenges: PT.func.isRequired,
  getDraftChallenges: PT.func.isRequired,
  getPastChallenges: PT.func.isRequired,
  lastRequestedPageOfDraftChallenges: PT.number.isRequired,
  lastRequestedPageOfPastChallenges: PT.number.isRequired,
  loadingActiveChallengesUUID: PT.string.isRequired,
  loadingDraftChallengesUUID: PT.string.isRequired,
  loadingPastChallengesUUID: PT.string.isRequired,
  markHeaderMenu: PT.func.isRequired,
  selectBucket: PT.func.isRequired,
  setFilter: PT.func.isRequired,
  activeBucket: PT.string.isRequired,
  sorts: PT.shape().isRequired,
  setSearchText: PT.func.isRequired,
  setSort: PT.func.isRequired,

  /* OLD PROPS BELOW */
  listingOnly: PT.bool,
  match: PT.shape({
    params: PT.shape({
      keyword: PT.string,
    }),
  }),
  challengeGroupId: PT.string,
  tag: PT.string,
  location: PT.shape({
    hash: PT.string,
  }).isRequired,
};

const mapStateToProps = (state) => {
  const cl = state.challengeListing;
  return {
    auth: state.auth,
    allDraftChallengesLoaded: cl.allDraftChallengesLoaded,
    allPastChallengesLoaded: cl.allPastChallengesLoaded,
    filter: cl.filter,
    challenges: cl.challenges,
    challengeSubtracks: cl.challengeSubtracks,
    challengeTags: cl.challengeTags,
    lastRequestedPageOfDraftChallenges: cl.lastRequestedPageOfDraftChallenges,
    lastRequestedPageOfPastChallenges: cl.lastRequestedPageOfPastChallenges,
    loadingActiveChallengesUUID: cl.loadingActiveChallengesUUID,
    loadingDraftChallengesUUID: cl.loadingDraftChallengesUUID,
    loadingPastChallengesUUID: cl.loadingPastChallengesUUID,
    loadingChallengeSubtracks: cl.loadingChallengeSubtracks,
    loadingChallengeTags: cl.loadingChallengeTags,
    sorts: cl.sorts,
    activeBucket: cl.sidebar.activeBucket,
  };
};

function mapDispatchToProps(dispatch) {
  const a = actions.challengeListing;
  const ah = headerActions.topcoderHeader;
  const fpa = filterPanelActions.challengeListing.filterPanel;
  const sa = sidebarActions.challengeListing.sidebar;
  return {
    dropChallenges: () => dispatch(a.dropChallenges()),
    getAllActiveChallenges: (token) => {
      const uuid = shortid();
      dispatch(a.getAllActiveChallengesInit(uuid));
      dispatch(a.getAllActiveChallengesDone(uuid, token));
    },
    getDraftChallenges: (page, token) => {
      const uuid = shortid();
      dispatch(a.getDraftChallengesInit(uuid, page));
      dispatch(a.getDraftChallengesDone(uuid, page, token));
    },
    getPastChallenges: (page, token) => {
      const uuid = shortid();
      dispatch(a.getPastChallengesInit(uuid, page));
      dispatch(a.getPastChallengesDone(uuid, page, token));
    },
    selectBucket: bucket => dispatch(sa.selectBucket(bucket)),
    setFilter: state => dispatch(a.setFilter(state)),
    setSearchText: text => dispatch(fpa.setSearchText(text)),
    setSort: (bucket, sort) => dispatch(a.setSort(bucket, sort)),
    markHeaderMenu: () =>
      dispatch(ah.setCurrentNav('Compete', 'All Challenges')),
  };
}

const ChallengeListingContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ListingContainer);

export default ChallengeListingContainer;
