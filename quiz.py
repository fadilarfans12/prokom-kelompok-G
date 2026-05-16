# data = [2, 8, 5, 3, 1, 4, 12, 10]
# sorted=[]
# for i in range(0, len(data)):
#     if data[i]>data[i+1]:
#         swap(data[i], data[i+1])
#     else:
#         return.sorted
# return.sorted
# print sorted
data = [2, 8, 5, 3, 1, 4, 12, 10]

for i in range(len(data)):
    for j in range(0, len(data)-i-1):
        if data[j] > data[j+1]:
            # swap
            data[j], data[j+1] = data[j+1], data[j]

print(data)