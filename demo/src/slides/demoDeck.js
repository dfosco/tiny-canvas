export function createDemoDeck(baseUrl) {
  const statefulUrl = (state = '', flow = 'default') =>
    `${baseUrl}stateful${flow === 'focused' ? '?flow=focused' : ''}${
      state ? `#${state}` : ''
    }`

  return {
    id: 'statefully-review',
    title: 'Statefully review',
    conclusion:
      'The presentation, frame deep links, and snapshots all preserve the exact Statefully URL.',
    slides: [
      {
        title: 'Open the review overview',
        description:
          'The base slide uses the default Statefully flow and targets the view controls.',
        url: statefulUrl(),
        displayUrl: 'tiny-canvas.dev/stateful',
        steps: [
          {
            type: 'cursor',
            targetId: 'stateful-view-toggle',
            scrollOffset: -16,
          },
          {
            type: 'click',
            url: statefulUrl('view=details'),
          },
        ],
      },
      {
        title: 'Restore a focused review state',
        description:
          'This slide opens details with the activity panel hidden from a complete shareable URL.',
        url: statefulUrl('view=details&showActivity=false', 'focused'),
        displayUrl: 'tiny-canvas.dev/stateful#view=details&showActivity=false',
        steps: [
          {
            type: 'cursor',
            targetId: 'stateful-activity-panel',
            scrollOffset: 24,
          },
          {
            type: 'click',
            url: statefulUrl('view=details&showActivity=true', 'focused'),
          },
        ],
      },
    ],
  }
}
