import json

file = 'higgs-activity_time.txt'

out  = []

with open(file, 'r') as f:
    for line in f:
        fields = line.split()
        #print(fields)
        out.append(fields)


        

    
with open('higgs.json', 'w') as f:
    json.dump(out, f)
