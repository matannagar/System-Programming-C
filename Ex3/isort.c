#include <stdio.h>

#define SIZE 50

void shift_element(int *arr, int i) {

    for (int *pointer = (arr + i); pointer > arr; pointer--) {
        *pointer = *(pointer - 1);
    }
}
void insertion_sort(int *arr, int len) {
    int counter;
    for (size_t i = 0; i < len; i++) {
        counter = 0;
        int *pointer;
        for(pointer=(arr+i); *(arr+i)< *(pointer-1) && pointer > arr ; pointer--){
            counter++;
        }
        if(counter>0){
            int temp = *(arr + i);
            shift_element(pointer,counter);
            *pointer=temp;
        }
    }
}

int main() {

//create an empty array
    int arr[SIZE];
    printf("Enter size numbers\n");
    for (size_t i = 0; i < SIZE; i++) {
        scanf("%d", (arr + i));
    }
    insertion_sort(arr, SIZE);
    for (size_t i = 0; i < SIZE; i++) {
        printf("%d,", *(arr + i));
    }
    return 0;
}
