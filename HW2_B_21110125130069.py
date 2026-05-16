# Homework 2
# Class: B
# Student ID: 21110125130069
# Name: Muhammad Fadil Arfansani

data = [3, 0, 8, 10, 11, 2,30, 1]

print("Data awal:", data)

def quicksort(arr: list) -> list:
   
    if len(arr) <= 1:
        return arr

    pivot = arr[-1]

    left = []
    right = []

    for i in range(len(arr) - 1):
        if arr[i] <= pivot:
            left.append(arr[i])
        else:
            right.append(arr[i])

    return quicksort(left) + [pivot] + quicksort(right)

print("Data akhir :", quicksort(data))