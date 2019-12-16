/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/**
 * Provides the component that a rolled up SLO attainment for an Organization
 *
 * @file
 * @author Gil Rice
 */
/** core */
import React from 'react';
import PropTypes from 'prop-types';

/** nr1 */
import { HeadingText, Spinner } from 'nr1';

/** local */
import CompositeAlertSlo from '../../../shared/queries/alert-driven-slo/composite';
import CompositeErrorBudgetSlo from '../../../shared/queries/error-budget-slo/composite';

/** 3rd party */
import BootstrapTable from 'react-bootstrap-table-next';

/**
 * OrgDisplayer
 */
export default class OrgDisplayer extends React.Component {
  static propTypes = {
    org: PropTypes.object,
    timeRange: PropTypes.object
  }; // propTypes

  constructor(props) {
    super(props);

    this.state = {
      org_slo_data: null,
      tableData: []
    }; // state
  } // constructor

  async componentDidMount() {
    await this._assembleOrganizationData();
  } // componentWillMount

  async componentDidUpdate(prevProps) {
    if (prevProps.org.orgName !== this.props.org.orgName) {
      await this._assembleOrganizationData();
    }

    if (prevProps.timeRange !== this.props.timeRange) {
      await this._assembleOrganizationData();
    }
  }

  async _assembleOrganizationData() {
    // get error budget SLOs
    const __eb_slos = this.props.org.slos.filter(function(value) {
      return value.slo.indicator === 'error_budget';
    });

    const __availability_slos = this.props.org.slos.filter(function(value) {
      return value.slo.indicator === 'availability';
    });

    const __capacity_slos = this.props.org.slos.filter(function(value) {
      return value.slo.indicator === 'capacity';
    });

    const __latency_slos = this.props.org.slos.filter(function(value) {
      return value.slo.indicator === 'latency';
    });

    // console.debug('error budget slos', __eb_slos);
    // console.debug('availability slos', __availability_slos);
    // console.debug('capacity slos', __capacity_slos);
    // console.debug('latency slos', __latency_slos);

    // indicator = error
    const __error_data_promises = __eb_slos.map(_eb_slo => {
      const slo_document = _eb_slo.slo;
      const timeRange = this.props.timeRange;
      const sloPromise = CompositeErrorBudgetSlo.query({
        slo_document,
        timeRange
      });

      return sloPromise;
    });

    // indicator availability
    const __availability_data_promises = __availability_slos.map(
      _availability_slo => {
        const slo_document = _availability_slo.slo;
        const timeRange = this.props.timeRange;
        const sloPromise = CompositeAlertSlo.query({
          slo_document,
          timeRange
        });

        return sloPromise;
      }
    );

    // indicator capacity
    const __capacity_data_promises = __capacity_slos.map(_capacity_slo => {
      const slo_document = _capacity_slo.slo;
      const timeRange = this.props.timeRange;
      const sloPromise = CompositeAlertSlo.query({
        slo_document,
        timeRange
      });

      return sloPromise;
    });

    // indicator latency
    const __latency_data_promises = __latency_slos.map(_latency_slo => {
      const slo_document = _latency_slo.slo;
      const timeRange = this.props.timeRange;
      const sloPromise = CompositeAlertSlo.query({
        slo_document,
        timeRange
      });

      return sloPromise;
    });

    const __org_error_slo_data = await Promise.all(__error_data_promises);
    const __org_availability_slo_data = await Promise.all(
      __availability_data_promises
    );
    const __org_latency_slo_data = await Promise.all(__latency_data_promises);
    const __org_capacity_slo_data = await Promise.all(__capacity_data_promises);

    // var __org_slo_data = this._getScopedOrgSLOData("7_day");
    // console.debug('dis is der org data ... ', __org_error_slo_data);

    this.setState({ org_slo_data: __org_error_slo_data });
    this.transformAndSetTableData({ data: __org_error_slo_data });
  } // _assembleOrganizationData

  transformAndSetTableData({ data }) {
    const tableData = data.map(row => {
      return this.transformData({ data: row });
    });
    this.setState({ tableData, org_slo_data: data });
  }

  /* Transform row data for bootstrap table */
  transformData({ data }) {
    const transformedData = {
      name: data.slo_document.name,
      target: data.slo_document.target,

      current: data.result_current.result,
      sevenDay: data.result_7_day.result,
      thirtyDay: data.result_30_day.result
    };

    return transformedData;
  }

  calculateTotalAttainment({ _slo_data }) {
    let __total_current_numerator = 0;
    let __total_current_denominator = 0;
    let __total_7_day_numerator = 0;
    let __total_7_day_denominator = 0;
    let __total_30_day_numerator = 0;
    let __total_30_day_denominator = 0;

    _slo_data.forEach(data => {
      __total_current_numerator =
        __total_current_numerator + data.result_current.numerator;
      __total_current_denominator =
        __total_current_denominator + data.result_current.denominator;

      __total_7_day_numerator =
        __total_7_day_numerator + data.result_7_day.numerator;
      __total_7_day_denominator =
        __total_7_day_denominator + data.result_7_day.denominator;

      __total_30_day_numerator =
        __total_30_day_numerator + data.result_30_day.numerator;
      __total_30_day_denominator =
        __total_30_day_denominator + data.result_30_day.denominator;
    });

    const currentAttainment =
      Math.round(
        (100 -
          (__total_current_numerator / __total_current_denominator) * 100) *
          1000
      ) / 1000;

    const sevenDayAttainment =
      Math.round(
        (100 - (__total_7_day_numerator / __total_7_day_denominator) * 100) *
          1000
      ) / 1000;

    const thirtyDayAttainment =
      Math.round(
        (100 - (__total_30_day_numerator / __total_30_day_denominator) * 100) *
          1000
      ) / 1000;

    return {
      currentAttainment,
      sevenDayAttainment,
      thirtyDayAttainment
    };
  }

  renderBootStrapTableView() {
    const { tableData, org_slo_data } = this.state;
    const attainment = this.calculateTotalAttainment({
      _slo_data: org_slo_data
    });

    console.debug(attainment);

    const columns = [
      {
        dataField: 'name', // SLO
        text: 'Name',
        footer: 'Total attainment:',
        headerStyle: () => {
          return { width: '300px' };
        }
      },
      {
        dataField: 'current',
        text: 'Current',
        footer: `${attainment.currentAttainment}`
      },
      {
        dataField: 'sevenDay',
        text: 'Seven Day',
        footer: `${attainment.sevenDayAttainment}`
      },
      {
        dataField: 'thirtyDay',
        text: 'Thirty Day',
        footer: `${attainment.thirtyDayAttainment}`
      },
      {
        dataField: 'target',
        text: 'Target',
        footer: '--'
      }
    ];

    return (
      <>
        <HeadingText
          className="summary-table-header"
          spacingType={[HeadingText.SPACING_TYPE.EXTRA_LARGE]}
        >
          Service Level Objectives
        </HeadingText>
        <BootstrapTable
          keyField="name"
          data={tableData}
          columns={columns}
          striped={false}
          wrapperClasses="slo-table-container"
          classes="slo-table slo-summary-table"
          footerClasses="attainment-footer"
        />
      </>
    );
  }

  render() {
    const { org_slo_data } = this.state;

    if (org_slo_data === null) {
      return (
        <div>
          <Spinner />
        </div>
      );
    } // if

    return <>{this.renderBootStrapTableView()}</>;
  } // render
} // OrgDisplayer
