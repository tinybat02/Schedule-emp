import React, { PureComponent } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions, Frame, DayObj } from 'types';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { process } from './utils/helpFunc';

interface Props extends PanelProps<PanelOptions> {}
interface State {
  data: Array<DayObj> | null;
  keys: string[];
}

export class MainPanel extends PureComponent<Props> {
  state: State = {
    data: null,
    keys: [],
  };

  componentDidMount() {
    const series = this.props.data.series as Frame[];

    if (series.length == 0) return;

    const empSerie = series.find(i => i.name == 'employee');
    const customersSerie = series.find(i => i.name == 'customers');

    if (!empSerie || !customersSerie) return;

    const nb_employee = empSerie?.fields[0].values.buffer.reduce((sum: number, i: number) => sum + i, 0);

    const { timezone, open_hour, close_hour } = this.props.options;

    const { data, keys } = process(customersSerie, nb_employee, open_hour, close_hour, timezone);
    this.setState({ data, keys });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.data.series !== this.props.data.series) {
      const series = this.props.data.series as Frame[];

      this.setState({ data: null, keys: [] });
      if (series.length == 0) {
        return;
      }

      const empSerie = series.find(i => i.name == 'employee');
      const customersSerie = series.find(i => i.name == 'customers');

      if (!empSerie || !customersSerie) return;

      const nb_employee = empSerie?.fields[0].values.buffer.reduce((sum: number, i: number) => sum + i, 0);

      const { timezone, open_hour, close_hour } = this.props.options;

      const { data, keys } = process(customersSerie, nb_employee, open_hour, close_hour, timezone);
      setTimeout(() => {
        this.setState({ data, keys });
      }, 500);
    }
  }

  render() {
    const { width, height } = this.props;
    const { data, keys } = this.state;

    if (!data) {
      return <div />;
    }

    return (
      <div
        style={{
          width,
          height,
          position: 'relative',
        }}
      >
        <ResponsiveHeatMap
          data={data}
          keys={keys}
          indexBy="emp"
          margin={{ top: 0, right: 0, bottom: 30, left: 10 }}
          forceSquare={true}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            orient: 'bottom',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: '',
            legendOffset: 36,
          }}
          axisLeft={{
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            //legend: 'date',
            legendPosition: 'middle',
            legendOffset: -40,
          }}
          cellOpacity={0.7}
          cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
          colors="blues"
          enableLabels={false}
          isInteractive={false}
          // @ts-ignore
          defs={[
            {
              id: 'lines',
              type: 'patternLines',
              background: 'inherit',
              color: 'rgba(0, 0, 0, 0.1)',
              rotation: -45,
              lineWidth: 4,
              spacing: 7,
            },
          ]}
          fill={[{ id: 'lines' }]}
          animate={true}
          motionStiffness={80}
          motionDamping={9}
          // hoverTarget="cell"
          cellHoverOthersOpacity={0.25}
        />
      </div>
    );
  }
}
