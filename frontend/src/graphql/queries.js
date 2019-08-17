// eslint-disable
// this is an auto generated file. This will be overwritten
export const getCard = `query getCard($card_id: ID!) {
    listCards(card_id: $card_id) {
        card_id,
        front_text,
        back_text,
        back_audio
    }
}
`;

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
        back_audio
      }
      nextToken
    }
  }
  `;