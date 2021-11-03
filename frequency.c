#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define ARRAY_SIZE(a) sizeof(a) / sizeof(a[0])
#define num_of_chars 26

//create a struct of the tree node
struct Trie {
	//each Trie will hold an array with 26 lettes
    struct Trie *character[num_of_chars];
    int isLeaf;    // 1 when node is a leaf node
    int word;
};
//from every root there will be a subtrie 
struct Trie *subTrie() {
    //provide memory for the given letters array
    struct Trie *node = (struct Trie *) calloc(26,sizeof(struct Trie));
    //yet to set this node as leaf
    node->isLeaf = 0;
    node->word = 0;
    //set null to the Node letter array list
    for (int i = 0; i < num_of_chars - 1; i++) {
        node->character[i] = NULL;
    }
    //this returns a node with allocated array list
    return node;
}
/*
*insert function enables us to loop through the tree and create subtries
*in case a word doesn't exists
*/
void insert(struct Trie *head, char *str) {
    // start from root node
    struct Trie *curr = head;
    //flag will let us know if a word was viable and could enter the tree
    bool flag = false;
    /*
    *while the pointer is not null we are going to make sure that every alpha letter
    *will become smaller case  
	*/
    while (*str) {
        if (*str >= 65 && *str <= 90) {
            *str = *str + 32;
        }
        /*
        *once we made sure the letters are small case and are exactly between 'a' and 'z'
        *we'll permit the word to enter the Trie
        */
        if (*str <= 122 && *str >= 97) {
            /*
            *create a new node if path doesn't exists
            *converts the character into an int and subtract 'a' ascii value so it fits to the array
            */
            if (curr->character[*str - 'a'] == NULL) {
                //creates a new trie in case the array spot is empty
                curr->character[*str - 'a'] = subTrie();
            }
            // move to the next node
            curr = curr->character[*str - 'a'];
            flag = true;
        }
        // move to next character of the word
        str++;
    }

    /* 
    *mark current node as leaf(a viable word)
    *tells us how many words have passed through this node
    */
    if(flag) {
        curr->word++;
        curr->isLeaf = 1;
    }
}

/*
*printTrie is a recursive function that iterates through the tree and allows us
*access every level of the tree and prints every word that is marked with isLeaf==1
*This print is an inorder- alphabetical- sorted print since it goes from the left side of the array 'a'
*to the right side of the array 'z'
*/
void printTrie(struct Trie *root, char *str, int level) {
    if (root->isLeaf == 1) {
        str[level] = '\0';
        printf("%s %d\n", str, root->word);
    }
    for (int i = 0; i < num_of_chars; i++) {
        if (root->character[i]) {
            str[level] = i + 'a';
            printTrie(root->character[i], str, level + 1);
        }
    }
}

/*
*this function does the same thing as printTrie, only in reverse. starts from 'z' in the array until 'a';
*/
void printTrieR(struct Trie *root, char *str, int level) {
    for (int i = num_of_chars - 1; i >= 0; i--) {
        if (root->character[i]) {
            str[level] = i + 'a';
            printTrieR(root->character[i], str, level + 1);
        }
    }
    if (root->isLeaf == 1) {
        str[level] = '\0';
        printf("%s %d\n", str, root->word);
    }
}

/*
*read_stdin allows us to fetch terminal input and dynamiclly allocate memory to it.
*every time the buffer reaches its full capacity, we'll double the amount of space
*/
static char *read_stdin(void) {
    size_t cap = 4096, len = 0;
    char *buffer = malloc(cap * sizeof(char));
    int c;

    while (!feof(stdin) && (c = fgetc(stdin)) != '\0') {
        if (c=='\n' || c=='\t' || c=='\r')
            c=' ';
        buffer[len] = c;
        /*when cap == len, we need to resize the buffer
         * so that we dont overwrite any bytes*/
        if (++len == cap)
            buffer = realloc(buffer, (cap *= 2) * sizeof(char));
    }
    //trim off any unused bytes from the buffer
    buffer = realloc(buffer, (len + 1) * sizeof(char));
    buffer[len] = '\0';

    return buffer;
}

/*
*recursive function that iterates through the TRIE nodes and frees up the memory allocated to it
*/
static void free_memory(struct Trie *curr){
    if (curr == NULL)
        return;
    else{
        for (int i = 0; i < num_of_chars; i++) {
            free_memory((curr->character)[i]);
        }
    }
    free(curr);
    return;
}

int main(int argc, char *argv[]) {
    struct Trie *head = subTrie();
    char *input = read_stdin();

    //seperates every word in the sentence using dilimator
    char *p;
    p = strtok(input, " ");

    // eperate the words and put them into the TRIE
    while (p != NULL) {
        if('p'>0)
            insert(head, p);
        p = strtok(NULL, " ");
    }

    char str[4095];
    if (argc == 2){
        if (*argv[1] == 'r' || *argv[1] == 'R')
            printTrieR(head, str, 0);
    }
    else
        printTrie(head, str, 0);

    free(input);
    free_memory(head);
    return 0;
}