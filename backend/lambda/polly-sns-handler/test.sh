sam local invoke \
  -t ../../template.yaml \
  -e event.json \
  -n ../environment.json \
  PollySnsHandler