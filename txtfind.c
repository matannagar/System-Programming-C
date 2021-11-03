
#include <stdio.h>
#include <string.h>


#define SIZE 64000

int substring(char *str1, char *str2) {
    char *p1 = str1;
    char *p2 = str2;
    while (*p1 != '\0' && *p2 != '\0') {
        while (*p1 != '\0' && *p2 != '\0' && *p1 == *p2) {
            p1++;
            p2++;
        }
        if (*p2 == '\0') {
            return 1;
        }
        p2 = str2;
        p1++;
    }
    return 0;
}

int similar(char *str1, char *str2, int n) {
    char *p1 = str1;
    char *p2 = str2;
    int counter = n;

    while (*p1 != '\0' || *p2 != '\0') {

        while (*p1 != '\0') {
            if (*p1 == *p2) {
                p1++;
                p2++;
            } else {
                counter--;
                p1++;
            }
        }
        if (*p2 != '\0') {
            return 0;
        }
    }
    if (counter < 0) return 0;
    else return 1;
}

void print_lines(char *str) {
    int count = 0;
    char *word;
    while (str) {
        count++;
        char *nextLine = strchr(str, '\n');
        if (nextLine) *nextLine = '\0';
        if (count == 1) {
            word = strtok(str, " ");
        }
        if (substring(str, word) == 1 && count > 1)
            printf("%s\n", str);
        if (nextLine) *nextLine = '\n';
        str = nextLine ? (nextLine + 1) : NULL;
    }
}

//this function will get us the first word of the text
char *deblank(char *input) {
    int i, j;
    char *output = input;
    for (i = 0, j = 0; i < strlen(input); i++, j++) {
        if (input[i] != ' ' && input[i] != '\n' && input[i] != '\t') {
            output[j] = input[i];
        } else {
            j--;
        }
    }
    output[j] = 0;
    return output;
}

//strip will remove any kind of \n or \t from the String
void strip(char *input) {
    char *p2 = input;
    while (*input != '\0') {
        if (*input != '\t' && *input != '\n' && *input != '\r') {

            *p2++ = *input++;
        } else {
            *p2++ = ' ';
            ++input;
        }
    }
    *p2 = '\0';
}

void print_similar_words(char *str) {
    int count = 0;
    //strip will remove any kind of \n or \t from the String
    strip(str);
    //strtok will seperate words by spaces
    char delim[] = " ";
    char *ptr = strtok(str, delim);

    //deblank will 'clean' the word we are looking for from spaces, tabs and else...
    char *word = deblank(str);

    while (ptr != NULL) {
        count++;
        if (similar(ptr, word, 1) && count > 1)
            printf("%s,", ptr);
        ptr = strtok(NULL, delim);
    }
}

int main() {

    char c[64000];
    char t[64000];
    while (fgets(t, 64000, stdin)) {
        strcat(c, t);
    }

// creates a copy of the given text

    char C1[SIZE];
    char C2[SIZE];
    char C3[SIZE];
    strcpy(C1, c);
    strcpy(C2, c);
    strcpy(C3, c);
//gets the choise A or B from the text file

//    the first line of the text
    char *nextLine = strchr(C3, '\n');
    if (nextLine) *nextLine = '\0';
    char *word = strtok(C3, "\0");
    size_t d = strlen(C3);

    //    loop through the first line until the end of the sentence
    for (int i = 0; i < d; i++) {
        if (i == d - 2) {
            word = &C3[i];
        }
    }
    strip(word);
    deblank(word);
    //both options for activating the correct function
    char *C = word;
    char *A = "a";
    char *B = "b";

    // strcmp checks which choise was given

    if (strcmp(A, C) == 0) {
        print_lines(C2);
        printf("\n");
    } else if (strcmp(B, C) == 0) {
        print_similar_words(C1);
        printf("\n");
    }
    return 0;
}
