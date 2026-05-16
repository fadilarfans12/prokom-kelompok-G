# Homework 1
# Class: B
# Student ID: 21110125130069
# Name: Muhammad Fadil Arfansani

rows = int(input("Masukkan jumlah baris: "))


def pascal_triangle(rows):
    triangle = []


    for i in range(rows):
        row = []
        for j in range(i + 1):
            if j == 0 or j == i:
                row.append(1)
            else:
                value = triangle[i-1][j-1] + triangle[i-1][j]
                row.append(value)
        triangle.append(row)

    return triangle


triangle = pascal_triangle(rows)

print("[", triangle[0])

for row in triangle[1:-1]:
    print(row)

print(triangle[-1], ']')
print (type(triangle))
print(isinstance(triangle, str))
