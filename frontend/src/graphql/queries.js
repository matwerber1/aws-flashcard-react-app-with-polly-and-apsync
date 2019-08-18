// eslint-disable
// this is an auto generated file. This will be overwritten

export const listCards = `query ListCards(
    $filter: ModelCardFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCards(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        card_id
        front_text
        back_text
      }
      nextToken
    }
  }
`;